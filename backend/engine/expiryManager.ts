import { mockProducts } from '../data/products.js';
import { ProductBatch } from '../types.js';

class ExpiryManager {
  private batches: ProductBatch[] = [];

  constructor() {
    this.initBatches();
  }

  private initBatches() {
    this.batches = [
      {
        batchId: 'B-MLK-881',
        productId: 'prod-milk-01',
        mrp: 30,
        discountedPrice: 18,
        quantity: 8,
        manufacturingDate: '2026-09-12',
        expiryDate: '2026-09-14',
        daysRemaining: 1,
        discountPercent: 40,
        fifoPriority: 1
      },
      {
        batchId: 'B-BRD-412',
        productId: 'prod-bread-01',
        mrp: 60,
        discountedPrice: 42,
        quantity: 11,
        manufacturingDate: '2026-09-11',
        expiryDate: '2026-09-15',
        daysRemaining: 2,
        discountPercent: 30,
        fifoPriority: 2
      },
      {
        batchId: 'B-JUC-903',
        productId: 'prod-juice-01',
        mrp: 110,
        discountedPrice: 77,
        quantity: 6,
        manufacturingDate: '2026-09-10',
        expiryDate: '2026-09-15',
        daysRemaining: 2,
        discountPercent: 30,
        fifoPriority: 3
      },
      {
        batchId: 'B-CRD-302',
        productId: 'prod-curd-01',
        mrp: 50,
        discountedPrice: 38,
        quantity: 14,
        manufacturingDate: '2026-09-12',
        expiryDate: '2026-09-16',
        daysRemaining: 3,
        discountPercent: 24,
        fifoPriority: 4
      },
      {
        batchId: 'B-BTR-119',
        productId: 'prod-butter-01',
        mrp: 60,
        discountedPrice: 54,
        quantity: 18,
        manufacturingDate: '2026-09-01',
        expiryDate: '2026-09-28',
        daysRemaining: 15,
        discountPercent: 10,
        fifoPriority: 5
      }
    ];
  }

  public getBatches(): (ProductBatch & { productName: string; brand: string; imageUrl: string })[] {
    return this.batches.map((batch) => {
      const prod = mockProducts.find((p) => p.id === batch.productId);
      return {
        ...batch,
        productName: prod?.name || 'Perishable SKU',
        brand: prod?.brand || 'Standard',
        imageUrl: prod?.imageUrl || ''
      };
    });
  }

  // Update dynamic discount for batch
  public applyDynamicDiscount(batchId: string, customDiscountPercent: number): boolean {
    const batch = this.batches.find((b) => b.batchId === batchId);
    if (!batch) return false;

    batch.discountPercent = customDiscountPercent;
    batch.discountedPrice = Math.round(batch.mrp * (1 - customDiscountPercent / 100));
    return true;
  }
}

export const expiryManager = new ExpiryManager();
