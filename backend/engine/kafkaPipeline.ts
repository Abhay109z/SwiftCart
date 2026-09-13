import { DLQMessage, KafkaEvent, Order } from '../types.js';

type EventHandler = (event: KafkaEvent) => Promise<void>;

class KafkaPipeline {
  private events: KafkaEvent[] = [];
  private dlqMessages: DLQMessage[] = [];
  private subscriptions: Map<string, EventHandler[]> = new Map();
  private offsetCounter = 1000;

  constructor() {
    this.initDefaultConsumers();
  }

  // Subscribe to topic
  public subscribe(topic: string, handler: EventHandler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic)!.push(handler);
  }

  // Publish event to Kafka topic
  public async publish(
    topic: KafkaEvent['topic'],
    orderId: string,
    payload: Record<string, unknown>,
    consumerGroup = 'quick-commerce-fulfillment'
  ): Promise<KafkaEvent> {
    this.offsetCounter++;
    const latencyMs = Math.floor(Math.random() * 8) + 3; // 3ms - 11ms realistic Kafka network broker latency

    const event: KafkaEvent = {
      eventId: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      topic,
      timestamp: Date.now(),
      orderId,
      payload,
      partition: Math.floor(Math.random() * 3), // 3 partitions (p0, p1, p2)
      offset: this.offsetCounter,
      consumerGroup,
      latencyMs
    };

    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events.pop();
    }

    // Trigger consumers asynchronously (non-blocking decouple)
    setTimeout(() => {
      this.dispatchToConsumers(event);
    }, 5);

    return event;
  }

  private async dispatchToConsumers(event: KafkaEvent) {
    const handlers = this.subscriptions.get(event.topic);
    if (!handlers || handlers.length === 0) return;

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (err: unknown) {
        const errorReason = err instanceof Error ? err.message : String(err);
        this.sendToDLQ(event.topic, event.orderId, event.payload, errorReason);
      }
    }
  }

  // Route failed message to Dead Letter Queue (DLQ)
  public sendToDLQ(
    originalTopic: string,
    orderId: string,
    payload: Record<string, unknown>,
    errorReason: string
  ) {
    const dlqItem: DLQMessage = {
      id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      originalTopic,
      orderId,
      failedAt: Date.now(),
      retryCount: 0,
      errorReason,
      payload,
      resolved: false
    };

    this.dlqMessages.unshift(dlqItem);

    this.publish('dlq.failed', orderId, {
      dlqId: dlqItem.id,
      originalTopic,
      reason: errorReason
    });
  }

  // DLQ Replay / Auto-Retry Mechanism
  public async retryDLQMessage(dlqId: string): Promise<{ success: boolean; message: string }> {
    const item = this.dlqMessages.find((d) => d.id === dlqId);
    if (!item) return { success: false, message: 'DLQ item not found' };

    item.retryCount++;
    item.resolved = true;

    await this.publish(item.originalTopic as KafkaEvent['topic'], item.orderId, {
      ...item.payload,
      replayedFromDLQ: true,
      retryAttempt: item.retryCount
    });

    return { success: true, message: `Re-published message ${dlqId} to ${item.originalTopic}` };
  }

  public getRecentEvents(limit = 50): KafkaEvent[] {
    return this.events.slice(0, limit);
  }

  public getDLQMessages(): DLQMessage[] {
    return this.dlqMessages;
  }

  // Default Kafka consumer workers
  private initDefaultConsumers() {
    this.subscribe('order.placed', async (evt) => {
      // Worker 1: Payment Gateway Webhook Verification
      // In high concurrency, consumer verifies payment signature in ~12ms
      console.log(`[Kafka Worker] Consuming order.placed for ${evt.orderId} on partition ${evt.partition}`);
    });

    this.subscribe('payment.verified', async (evt) => {
      // Worker 2: Trigger dark store warehouse picking slip print
      console.log(`[Kafka Worker] Consuming payment.verified for ${evt.orderId}`);
    });
  }

  // Saga Orchestration Helper: Execute pipeline with automatic compensation rollback
  public async executeSagaOrderPipeline(order: Order): Promise<{
    success: boolean;
    sagaSteps: Order['sagaSteps'];
    failedStep?: string;
  }> {
    const steps: Order['sagaSteps'] = [];

    // Step 1: Idempotency & Payment Verification
    const step1Start = performance.now();
    await this.publish('order.placed', order.id, {
      amount: order.totalAmount,
      customer: order.customerName
    });
    steps.push({
      name: 'PAYMENT_AUTHORIZATION',
      status: 'success',
      timestamp: Date.now(),
      latencyMs: Math.round(performance.now() - step1Start + 8),
      details: 'Card authorized via Payment Orchestrator. Razorpay/Stripe token locked.'
    });

    // Step 2: Dark Store ACID Row Lock & Inventory Deduction
    const step2Start = performance.now();
    let inventoryFailed = false;

    // Simulate inventory lock check
    for (const item of order.items) {
      if (item.quantity > 50) {
        inventoryFailed = true;
        break;
      }
    }

    if (inventoryFailed) {
      steps.push({
        name: 'INVENTORY_RESERVATION',
        status: 'failed',
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - step2Start + 15),
        details: 'Insufficient inventory locked in primary PostgreSQL store.'
      });

      // TRIGGER SAGA COMPENSATION: Refund Payment
      const compStart = performance.now();
      await this.publish('saga.compensated', order.id, {
        action: 'REFUND_PAYMENT',
        amount: order.totalAmount
      });
      steps.push({
        name: 'COMPENSATING_TRANSACTION_REFUND',
        status: 'compensated',
        timestamp: Date.now(),
        latencyMs: Math.round(performance.now() - compStart + 12),
        details: 'Compensating Saga action: Payment refunded back to source instrument.'
      });

      this.sendToDLQ('inventory.locked', order.id, { items: order.items }, 'Inventory reservation failed');
      return { success: false, sagaSteps: steps, failedStep: 'INVENTORY_RESERVATION' };
    }

    await this.publish('inventory.locked', order.id, { itemsCount: order.items.length });
    steps.push({
      name: 'INVENTORY_RESERVATION',
      status: 'success',
      timestamp: Date.now(),
      latencyMs: Math.round(performance.now() - step2Start + 6),
      details: 'PostgreSQL row-level lock acquired. Redis inventory cache updated.'
    });

    // Step 3: Packing Slip Generation & Picker Terminal Dispatch
    const step3Start = performance.now();
    await this.publish('packing.generated', order.id, {
      darkStoreId: order.darkStoreId,
      toteId: `TOTE-${Math.floor(100 + Math.random() * 900)}`
    });
    steps.push({
      name: 'PICKING_SLIP_GENERATED',
      status: 'success',
      timestamp: Date.now(),
      latencyMs: Math.round(performance.now() - step3Start + 4),
      details: 'Barcode tote assigned to dark store picker with FIFO priority batches.'
    });

    // Step 4: PostGIS Nearest Delivery Partner Matching
    const step4Start = performance.now();
    await this.publish('rider.dispatched', order.id, {
      riderId: order.rider?.id,
      riderName: order.rider?.name
    });
    steps.push({
      name: 'RIDER_DISPATCH_POSTGIS',
      status: 'success',
      timestamp: Date.now(),
      latencyMs: Math.round(performance.now() - step4Start + 9),
      details: `Dispatched to nearest EV rider ${order.rider?.name || 'Rider'} (Radius < 1.2km).`
    });

    return { success: true, sagaSteps: steps };
  }
}

export const kafkaPipeline = new KafkaPipeline();
