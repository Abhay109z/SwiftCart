import { Order } from '../types.js';

interface CachedResponse {
  statusCode: number;
  order: Order;
  createdAt: number;
}

class IdempotencyStore {
  // Simulating Redis SET key value EX 86400 NX
  private store: Map<string, CachedResponse> = new Map();
  private inFlightKeys: Set<string> = new Set();

  // Check if key is currently being processed by another concurrent request
  public acquireLock(idempotencyKey: string): boolean {
    if (this.inFlightKeys.has(idempotencyKey)) {
      return false; // Concurrent double-tap detected!
    }
    this.inFlightKeys.add(idempotencyKey);
    return true;
  }

  public releaseLock(idempotencyKey: string) {
    this.inFlightKeys.delete(idempotencyKey);
  }

  public get(idempotencyKey: string): CachedResponse | undefined {
    return this.store.get(idempotencyKey);
  }

  public set(idempotencyKey: string, order: Order, statusCode = 201) {
    this.store.set(idempotencyKey, {
      statusCode,
      order,
      createdAt: Date.now()
    });
    this.inFlightKeys.delete(idempotencyKey);
  }
}

export const idempotencyStore = new IdempotencyStore();
