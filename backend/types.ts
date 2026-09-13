export interface DarkStore {
  id: string;
  name: string;
  code: string;
  address: string;
  lat: number;
  lng: number;
  coverageRadiusKm: number;
  activePickers: number;
  activeRiders: number;
  capacityUtilization: number; // percentage
  status: 'optimal' | 'busy' | 'surge';
}

export interface ProductBatch {
  batchId: string;
  productId: string;
  mrp: number;
  discountedPrice: number;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  daysRemaining: number;
  discountPercent: number;
  fifoPriority: number; // lower number = older batch, ship first
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'dairy' | 'produce' | 'beverages' | 'snacks' | 'bakery' | 'essentials';
  unit: string;
  price: number;
  mrp: number;
  imageUrl: string;
  description: string;
  inStock: boolean;
  tags: string[];
  colloquialTerms: string[];
  isPerishable: boolean;
  currentStock: number;
  batches?: ProductBatch[];
  darkStoreId: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  vehicle: string;
  vehicleNumber: string;
  rating: number;
  deliveriesCompleted: number;
  lat: number;
  lng: number;
  status: 'idle' | 'assigned' | 'picking' | 'en_route' | 'delivered';
  currentOrderId?: string;
  speedKmph: number;
}

export type OrderStatus =
  | 'placed'
  | 'payment_verified'
  | 'inventory_locked'
  | 'packing'
  | 'packed'
  | 'rider_assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  imageUrl: string;
  batchId?: string;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  darkStoreId: string;
  darkStoreName: string;
  customerName: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  surgeFee: number;
  handlingFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  gracePeriodEndsAt: number; // 30s window to append forgotten item
  estimatedDeliveryMinutes: number;
  rider?: Rider;
  sagaSteps: {
    name: string;
    status: 'pending' | 'success' | 'failed' | 'compensated';
    timestamp: number;
    latencyMs: number;
    details?: string;
  }[];
  substitutedItems?: {
    originalItem: string;
    substituteItem: string;
    priceDiff: number;
    reason: string;
  }[];
}

export interface KafkaEvent {
  eventId: string;
  topic: 'order.placed' | 'payment.verified' | 'inventory.locked' | 'packing.generated' | 'rider.dispatched' | 'dlq.failed' | 'saga.compensated';
  timestamp: number;
  orderId: string;
  payload: Record<string, unknown>;
  partition: number;
  offset: number;
  consumerGroup: string;
  latencyMs: number;
}

export interface DLQMessage {
  id: string;
  originalTopic: string;
  orderId: string;
  failedAt: number;
  retryCount: number;
  errorReason: string;
  payload: Record<string, unknown>;
  resolved: boolean;
}

export interface SurgeZone {
  geohash: string;
  zoneName: string;
  activeOrders: number;
  availableRiders: number;
  demandRatio: number;
  surgeMultiplier: number;
  surgeFee: number;
  color: string;
  centerLat: number;
  centerLng: number;
}

export interface ConcurrencyTestResult {
  productId: string;
  productName: string;
  initialStock: number;
  totalRequests: number;
  fulfilledRequests: number;
  rejectedRequests: number;
  finalStock: number;
  negativeInventoryPrevented: boolean;
  redisCacheHitRatio: number;
  avgLockAcquisitionMs: number;
  totalDurationMs: number;
  concurrencyLevel: number;
  transactions: {
    reqId: number;
    threadId: string;
    status: 'FULFILLED' | 'STOCK_EXHAUSTED' | 'LOCK_TIMEOUT';
    lockTimeMs: number;
    remainingStock: number;
  }[];
}

export interface DeliveryPartnerApplication {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  preferredHubId: string;
  preferredHubName: string;
  vehicleType: 'ev_scooter' | 'motorcycle' | 'bicycle' | 'none';
  drivingLicenseNumber?: string;
  panCard: string;
  aadhaarNumber: string;
  bankAccountNumber: string;
  ifscCode: string;
  preferredShift: 'morning' | 'evening' | 'night' | 'flexible';
  hasSmartphone: boolean;
  status: 'pending_verification' | 'approved' | 'onboarded';
  appliedAt: number;
  expectedMonthlyEarnings: string;
  assignedHubAddress?: string;
}
