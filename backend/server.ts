import express, { Request, Response } from 'express';
import { aiSubstitutionEngine } from './engine/aiSubstitutionEngine.js';
import { expiryManager } from './engine/expiryManager.js';
import { geospatialEngine } from './engine/geospatialEngine.js';
import { idempotencyStore } from './engine/idempotencyStore.js';
import { inventoryLockEngine } from './engine/inventoryLockEngine.js';
import { kafkaPipeline } from './engine/kafkaPipeline.js';
import { mockDarkStores } from './data/darkStores.js';
import { DeliveryPartnerApplication, Order, OrderItem } from './types.js';
import { getMongoDb, getMongoTelemetry, persistOrderToMongo, persistPartnerApplicationToMongo } from './db/mongodb.js';

export const app = express();
app.use(express.json());

// In-Memory active orders store
const activeOrders: Map<string, Order> = new Map();
// In-Memory delivery partner applications store
const partnerApplications: Map<string, DeliveryPartnerApplication> = new Map();
// SSE clients for real-time order tracking & Kafka live streaming
const sseClients: Response[] = [];

function broadcastSSE(type: string, data: unknown) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      // client disconnected
    }
  }
}

// 1. Health check & System Info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SwiftCart Quick-Commerce Backend Engine',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// MongoDB Atlas Cluster Telemetry & Connectivity
app.get('/api/db/status', async (_req: Request, res: Response) => {
  try {
    await getMongoDb();
    const telemetry = getMongoTelemetry();
    res.json(telemetry);
  } catch (err: unknown) {
    res.json({
      status: 'error',
      database: 'swiftcart',
      cluster: 'cluster0.a8jwybm.mongodb.net',
      error: err instanceof Error ? err.message : 'Connection failed'
    });
  }
});

// 2. Hyper-Local Dark Stores & GPS Mapping (PostGIS simulation)
app.get('/api/dark-stores', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (!isNaN(lat) && !isNaN(lng)) {
    const nearest = geospatialEngine.findNearestDarkStore(lat, lng);
    res.json({
      all: mockDarkStores,
      nearest: nearest.store,
      distanceKm: nearest.distanceKm,
      estimatedMinutes: nearest.estimatedMinutes,
      isDeliverable: nearest.isDeliverable
    });
    return;
  }

  res.json({ all: mockDarkStores, nearest: mockDarkStores[0] });
});

// 3. Products Catalog with Redis Sub-Millisecond Cache Status
app.get('/api/products', (req: Request, res: Response) => {
  const category = req.query.category as string;
  let products = inventoryLockEngine.getAllProducts();

  if (category && category !== 'all') {
    products = products.filter((p) => p.category === category);
  }

  // Attach fast Redis cache telemetry to each item
  const enriched = products.map((p) => {
    const cacheStatus = inventoryLockEngine.getFastStock(p.id);
    return {
      ...p,
      currentStock: cacheStatus.stock,
      inStock: cacheStatus.stock > 0,
      redisCacheLatencyMs: cacheStatus.latencyMs,
      cacheHit: cacheStatus.cacheHit
    };
  });

  res.json({ products: enriched });
});

// 4. Sub-50ms Fuzzy Semantic Search with Typo Tolerance & Regional Terms
app.get('/api/products/search', (req: Request, res: Response) => {
  const start = performance.now();
  const query = ((req.query.q as string) || '').trim().toLowerCase();

  if (!query) {
    res.json({ results: [], latencyMs: 0 });
    return;
  }

  const all = inventoryLockEngine.getAllProducts();

  const results = all.filter((prod) => {
    const nameMatch = prod.name.toLowerCase().includes(query);
    const brandMatch = prod.brand.toLowerCase().includes(query);
    const tagMatch = prod.tags.some((t) => t.toLowerCase().includes(query));
    const colloquialMatch = prod.colloquialTerms.some((c) =>
      c.toLowerCase().includes(query) || query.includes(c.toLowerCase())
    );

    // Fuzzy Levenshtein-like distance check for common typos (e.g., 'mislk' -> 'milk')
    const fuzzyMatch =
      prod.tags.some((t) => calculateSimilarity(t, query) > 0.65) ||
      calculateSimilarity(prod.name.slice(0, 10).toLowerCase(), query) > 0.6;

    return nameMatch || brandMatch || tagMatch || colloquialMatch || fuzzyMatch;
  });

  const latencyMs = Math.round((performance.now() - start + 0.3) * 100) / 100;
  res.json({ results, latencyMs, count: results.length });
});

function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;
  let matches = 0;
  const len = Math.min(s1.length, s2.length);
  for (let i = 0; i < len; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  return matches / Math.max(s1.length, s2.length);
}

// 5. Flash Checkout with Idempotency Key & Distributed Saga Pipeline
app.post('/api/checkout', async (req: Request, res: Response) => {
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) || `auto-${Date.now()}`;

  // Step A: Idempotency Protection (prevents duplicate payment/order on network drop or rapid double-tap)
  const cachedResponse = idempotencyStore.get(idempotencyKey);
  if (cachedResponse) {
    res.status(cachedResponse.statusCode).json({
      ...cachedResponse.order,
      _idempotentReplay: true
    });
    return;
  }

  const lockAcquired = idempotencyStore.acquireLock(idempotencyKey);
  if (!lockAcquired) {
    res.status(409).json({
      error: 'IDEMPOTENCY_CONFLICT: Concurrent checkout in flight with same key. Please wait.'
    });
    return;
  }

  const { items, customerName, customerAddress, userLat, userLng, darkStoreId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    idempotencyStore.releaseLock(idempotencyKey);
    res.status(400).json({ error: 'Cart cannot be empty' });
    return;
  }

  // Map to nearest dark store and nearest available EV delivery rider
  const cLat = userLat || 12.9352;
  const cLng = userLng || 77.6245;
  const nearestStore = geospatialEngine.findNearestDarkStore(cLat, cLng);
  const assignedRider = geospatialEngine.findNearestRider(nearestStore.store.lat, nearestStore.store.lng);

  // Dynamic surge calculation
  const surgeZones = geospatialEngine.calculateSurgeZones();
  const activeSurge = surgeZones.find((z) => z.zoneName.includes('Koramangala')) || surgeZones[0];

  let subtotal = 0;
  const orderItems: OrderItem[] = [];

  for (const item of items) {
    const product = inventoryLockEngine.getProductById(item.productId);
    if (!product) continue;
    const price = product.price;
    const total = price * item.quantity;
    subtotal += total;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: total,
      unit: product.unit,
      imageUrl: product.imageUrl
    });
  }

  const deliveryFee = 15;
  const handlingFee = 4;
  const surgeFee = activeSurge.surgeFee;
  const totalAmount = subtotal + deliveryFee + handlingFee + surgeFee;

  const orderId = `SC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const order: Order = {
    id: orderId,
    idempotencyKey,
    darkStoreId: darkStoreId || nearestStore.store.id,
    darkStoreName: nearestStore.store.name,
    customerName: customerName || 'Karthik Rao',
    customerAddress: customerAddress || 'Flat 402, Green Glen Heights, Koramangala 4th Block',
    customerLat: cLat,
    customerLng: cLng,
    items: orderItems,
    subtotal,
    deliveryFee,
    surgeFee,
    handlingFee,
    totalAmount,
    status: 'placed',
    createdAt: Date.now(),
    gracePeriodEndsAt: Date.now() + 30 * 1000, // 30-Second Post-Checkout Grace Period Window!
    estimatedDeliveryMinutes: nearestStore.estimatedMinutes,
    rider: assignedRider,
    sagaSteps: []
  };

  // Step B: Atomic ACID Inventory Locking
  for (const it of orderItems) {
    const lockResult = await inventoryLockEngine.atomicDeductInventory(
      it.productId,
      it.quantity,
      `tx-order-${orderId}`
    );

    if (!lockResult.success) {
      idempotencyStore.releaseLock(idempotencyKey);
      res.status(409).json({
        error: `Checkout Failed: ${it.productName} ran out of stock during rush lock.`,
        failedProduct: it.productName
      });
      return;
    }
  }

  // Step C: Execute Saga Orchestration with Kafka Pipeline
  const sagaResult = await kafkaPipeline.executeSagaOrderPipeline(order);
  order.sagaSteps = sagaResult.sagaSteps;

  if (!sagaResult.success) {
    order.status = 'cancelled';
    activeOrders.set(orderId, order);
    idempotencyStore.set(idempotencyKey, order, 400);
    res.status(400).json({
      error: 'Order pipeline failed during distributed saga execution. Compensated & refunded.',
      order
    });
    return;
  }

  order.status = 'rider_assigned';
  activeOrders.set(orderId, order);
  idempotencyStore.set(idempotencyKey, order, 201);

  persistOrderToMongo(order);
  broadcastSSE('order_update', order);

  res.status(201).json(order);
});

// 6. Post-Checkout 30-Second Grace Period: Append forgotten item with NO extra delivery fee!
app.post('/api/orders/:id/append-item', async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { productId, quantity = 1 } = req.body;

  const order = activeOrders.get(orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (Date.now() > order.gracePeriodEndsAt) {
    res.status(400).json({
      error: 'GRACE_PERIOD_EXPIRED: The 30-second post-checkout grace period has elapsed. Rider tote is already packed.'
    });
    return;
  }

  const product = inventoryLockEngine.getProductById(productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Atomic lock on appended item
  const lockRes = await inventoryLockEngine.atomicDeductInventory(
    productId,
    quantity,
    `grace-append-${orderId}`
  );

  if (!lockRes.success) {
    res.status(409).json({ error: 'Item out of stock' });
    return;
  }

  // Append without any additional delivery or surge fees!
  const addedTotal = product.price * quantity;
  order.items.push({
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice: addedTotal,
    unit: product.unit,
    imageUrl: product.imageUrl
  });

  order.subtotal += addedTotal;
  order.totalAmount += addedTotal;

  await kafkaPipeline.publish('packing.generated', order.id, {
    action: 'APPEND_FORGOTTEN_ITEM',
    product: product.name,
    toteUpdated: true
  });

  persistOrderToMongo(order);
  broadcastSSE('order_update', order);

  res.json({
    success: true,
    message: `Added ${product.name} seamlessly to active delivery with ₹0 extra delivery fee!`,
    order
  });
});

// 7. Real-Time Delivery Rider & Order GPS Tracking (10-minute timer + vector GPS updates)
app.get('/api/orders/:id/tracking', (req: Request, res: Response) => {
  const orderId = req.params.id;
  const order = activeOrders.get(orderId);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  // Calculate elapsed progress based on order creation time (10 min total cycle)
  const elapsedSeconds = Math.floor((Date.now() - order.createdAt) / 1000);
  const totalDeliverySeconds = order.estimatedDeliveryMinutes * 60;
  const progressFraction = Math.min(1.0, elapsedSeconds / totalDeliverySeconds);

  // Update order status milestones based on elapsed time
  if (progressFraction >= 1.0) {
    order.status = 'delivered';
  } else if (progressFraction > 0.4) {
    order.status = 'out_for_delivery';
  } else if (progressFraction > 0.15) {
    order.status = 'packed';
  }

  // Store coordinates
  const store = mockDarkStores.find((d) => d.id === order.darkStoreId) || mockDarkStores[0];
  const currentGPS = geospatialEngine.interpolateRiderPosition(
    store.lat,
    store.lng,
    order.customerLat,
    order.customerLng,
    progressFraction
  );

  const remainingSeconds = Math.max(0, totalDeliverySeconds - elapsedSeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;

  res.json({
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt,
    gracePeriodRemainingSeconds: Math.max(0, Math.floor((order.gracePeriodEndsAt - Date.now()) / 1000)),
    estimatedMinutes: order.estimatedDeliveryMinutes,
    remainingTimeFormatted: `${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')}`,
    progressFraction: Math.round(progressFraction * 100) / 100,
    storeLocation: { lat: store.lat, lng: store.lng, name: store.name },
    customerLocation: { lat: order.customerLat, lng: order.customerLng, address: order.customerAddress },
    riderCurrentLocation: {
      lat: currentGPS.lat,
      lng: currentGPS.lng,
      remainingMeters: currentGPS.remainingMeters
    },
    rider: order.rider,
    items: order.items,
    sagaSteps: order.sagaSteps
  });
});

// 8. Concurrency Stress Test Suite: 500 simultaneous checkout requests on 5 units of stock!
app.post('/api/concurrency-test/run', async (req: Request, res: Response) => {
  const concurrencyCount = parseInt(req.body.concurrencyCount || '500', 10);
  const productId = req.body.productId || 'prod-milk-flash-02';

  const result = await inventoryLockEngine.runConcurrencyStressTest(productId, concurrencyCount);

  // Publish event to Kafka
  await kafkaPipeline.publish('inventory.locked', `test-${Date.now()}`, {
    testType: 'CONCURRENCY_STRESS_TEST',
    concurrencyCount,
    fulfilled: result.fulfilledRequests,
    rejected: result.rejectedRequests,
    negativeInventoryPrevented: result.negativeInventoryPrevented
  });

  res.json(result);
});

// 9. Kafka Event Stream & DLQ Management
app.get('/api/kafka/events', (_req: Request, res: Response) => {
  res.json({
    events: kafkaPipeline.getRecentEvents(40),
    dlq: kafkaPipeline.getDLQMessages()
  });
});

app.post('/api/kafka/dlq/retry', async (req: Request, res: Response) => {
  const { dlqId } = req.body;
  const result = await kafkaPipeline.retryDLQMessage(dlqId);
  res.json(result);
});

// 10. Dynamic Surge Pricing & Heatmap Zones
app.get('/api/surge/zones', (_req: Request, res: Response) => {
  const zones = geospatialEngine.calculateSurgeZones();
  res.json({ zones });
});

// 11. Dark Store FIFO Perishable Expiry Tracker
app.get('/api/expiry-fifo/batches', (_req: Request, res: Response) => {
  const batches = expiryManager.getBatches();
  res.json({ batches });
});

app.post('/api/expiry-fifo/discount', (req: Request, res: Response) => {
  const { batchId, discountPercent } = req.body;
  const success = expiryManager.applyDynamicDiscount(batchId, discountPercent);
  res.json({ success });
});

// 12. AI-Driven Substitution Engine (Triggered when picker flags out-of-stock)
app.post('/api/picker/out-of-stock', async (req: Request, res: Response) => {
  const { productId } = req.body;
  const substitutes = await aiSubstitutionEngine.getSubstitutes(productId);
  const original = inventoryLockEngine.getProductById(productId);

  const payload = {
    originalProduct: original,
    substitutes,
    expiresAt: Date.now() + 60 * 1000 // Strict 60-second customer response window!
  };

  broadcastSSE('ai_substitution_alert', payload);
  res.json(payload);
});

// 13. Customer Accepts AI Substitute
app.post('/api/orders/:id/accept-substitute', (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { originalProductId, substituteProductId } = req.body;

  const order = activeOrders.get(orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const subProd = inventoryLockEngine.getProductById(substituteProductId);
  const origProd = inventoryLockEngine.getProductById(originalProductId);

  if (subProd && origProd) {
    // Replace in items
    const itemIndex = order.items.findIndex((it) => it.productId === originalProductId);
    if (itemIndex > -1) {
      order.items[itemIndex] = {
        productId: subProd.id,
        productName: subProd.name,
        quantity: order.items[itemIndex].quantity,
        unitPrice: subProd.price,
        totalPrice: subProd.price * order.items[itemIndex].quantity,
        unit: subProd.unit,
        imageUrl: subProd.imageUrl
      };

      if (!order.substitutedItems) order.substitutedItems = [];
      order.substitutedItems.push({
        originalItem: origProd.name,
        substituteItem: subProd.name,
        priceDiff: subProd.price - origProd.price,
        reason: 'Picker replaced missing item with AI verified match'
      });
    }
  }

  broadcastSSE('order_update', order);
  res.json({ success: true, order });
});

// 14. Server-Sent Events (SSE) for Real-Time Streaming
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx > -1) sseClients.splice(idx, 1);
  });
});

// 15. Delivery Partner Join & Onboarding API
app.post('/api/delivery-partners/apply', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      phone,
      email,
      city = 'Bengaluru',
      preferredHubId,
      vehicleType,
      drivingLicenseNumber,
      panCard,
      aadhaarNumber,
      bankAccountNumber,
      ifscCode,
      preferredShift = 'evening',
      hasSmartphone = true
    } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
      return;
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      res.status(400).json({ error: 'Valid 10-digit mobile phone number is required.' });
      return;
    }

    if (!vehicleType || !['ev_scooter', 'motorcycle', 'bicycle', 'none'].includes(vehicleType)) {
      res.status(400).json({ error: 'Please select a valid vehicle type (EV Scooter, Motorcycle, Bicycle, or None).' });
      return;
    }

    if ((vehicleType === 'motorcycle' || vehicleType === 'ev_scooter') && (!drivingLicenseNumber || drivingLicenseNumber.trim().length < 5)) {
      res.status(400).json({ error: 'Valid Driving License number is required for motorized vehicles.' });
      return;
    }

    const cleanPan = String(panCard || '').trim().toUpperCase();
    if (!cleanPan || cleanPan.length < 10) {
      res.status(400).json({ error: 'Valid 10-character PAN Card number is required for verification.' });
      return;
    }

    const cleanAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      res.status(400).json({ error: 'Valid 12-digit Aadhaar Card number is required for KYC identity check.' });
      return;
    }

    if (!bankAccountNumber || String(bankAccountNumber).trim().length < 6) {
      res.status(400).json({ error: 'Valid Bank Account number or UPI ID is required for weekly settlements.' });
      return;
    }

    if (!ifscCode || String(ifscCode).trim().length < 4) {
      res.status(400).json({ error: 'Valid Bank IFSC code is required.' });
      return;
    }

    const hub = mockDarkStores.find((s) => s.id === preferredHubId) || mockDarkStores[0];

    // Calculate expected monthly earnings
    let expectedMonthlyEarnings = '₹28,000 - ₹34,000 / month';
    if (preferredShift === 'night') {
      expectedMonthlyEarnings = '₹34,000 - ₹42,000 / month (Night Surge Active)';
    } else if (preferredShift === 'flexible') {
      expectedMonthlyEarnings = '₹16,000 - ₹22,000 / month (Part-time weekend)';
    } else if (preferredShift === 'evening') {
      expectedMonthlyEarnings = '₹30,000 - ₹36,000 / month (Peak dinner rush)';
    }

    const applicationId = `SWIFT-RIDER-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const application: DeliveryPartnerApplication = {
      id: applicationId,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? String(email).trim() : undefined,
      city,
      preferredHubId: hub.id,
      preferredHubName: hub.name,
      assignedHubAddress: hub.address,
      vehicleType,
      drivingLicenseNumber: drivingLicenseNumber?.trim().toUpperCase(),
      panCard: cleanPan,
      aadhaarNumber: `XXXX-XXXX-${cleanAadhaar.slice(-4)}`,
      bankAccountNumber: `XXXX${String(bankAccountNumber).slice(-4)}`,
      ifscCode: String(ifscCode).trim().toUpperCase(),
      preferredShift,
      hasSmartphone: Boolean(hasSmartphone),
      status: 'approved',
      appliedAt: Date.now(),
      expectedMonthlyEarnings
    };

    // Store in resilient Map and Mongo
    partnerApplications.set(applicationId, application);
    await persistPartnerApplicationToMongo(application);

    res.status(201).json({
      success: true,
      message: 'Delivery partner registration submitted and pre-approved!',
      application,
      onboardingDetails: {
        hubName: hub.name,
        hubAddress: hub.address,
        reportingSlot: 'Tomorrow between 10:00 AM - 1:00 PM',
        itemsToCarry: [
          'Original Aadhaar Card & PAN Card',
          vehicleType !== 'bicycle' && vehicleType !== 'none' ? 'Original Driving License' : null,
          'Cancelled cheque or Bank Passbook copy',
          'Smart Android or iOS Phone with active GPS'
        ].filter(Boolean),
        starterKit: [
          'Thermal Insulated Delivery Bag (40L)',
          'SwiftCart Branded Hi-Vis Reflective Jacket',
          'All-Weather Rain Poncho & Mobile Mount',
          'Rider Safety ID Card & Lanyard'
        ],
        helplinePhone: '+91 80 4912 8800'
      }
    });
  } catch (err: unknown) {
    console.error('Partner application error:', err);
    res.status(500).json({ error: 'Failed to process partner application. Please try again.' });
  }
});

app.get('/api/delivery-partners/applications', (_req: Request, res: Response) => {
  res.json({
    total: partnerApplications.size,
    applications: Array.from(partnerApplications.values())
  });
});

