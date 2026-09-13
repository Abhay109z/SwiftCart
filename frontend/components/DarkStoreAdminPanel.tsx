import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Tag,
  ArrowRight
} from 'lucide-react';
import { ProductBatch } from '../types.js';

interface BatchWithDetails extends ProductBatch {
  productName: string;
  brand: string;
  imageUrl: string;
}

interface DarkStoreAdminPanelProps {
  onTriggerPickerOutOfStock: (productId: string) => void;
}

export const DarkStoreAdminPanel: React.FC<DarkStoreAdminPanelProps> = ({
  onTriggerPickerOutOfStock
}) => {
  const [batches, setBatches] = useState<BatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('prod-milk-01');

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/expiry-fifo/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Failed to load FIFO batches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleApplyDiscount = async (batchId: string, percent: number) => {
    try {
      await fetch('/api/expiry-fifo/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, discountPercent: percent })
      });
      loadBatches();
    } catch (err) {
      console.error('Apply discount error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Boxes className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900">
              Dark Store FIFO & Inventory Expiry Operations
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            Quick-commerce dark stores prioritize older batches using First-In, First-Out (FIFO) logic and apply dynamic clearance pricing on perishables nearing expiry.
          </p>
        </div>

        <button
          onClick={loadBatches}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Batches</span>
        </button>
      </div>

      {/* Picker Terminal Simulator */}
      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Dark Store Picker Station: AI Substitution Simulator</span>
        </div>
        <p className="text-xs text-amber-800">
          Simulate a dark store picker packing a customer tote and encountering an out-of-stock item. This immediately fires an AI substitute recommendation to the customer with a 60-second decision timer.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-stone-900 outline-none"
          >
            <option value="prod-milk-01">Amul Taaza Milk 500ml</option>
            <option value="prod-bread-01">The Health Factory Bread 350g</option>
            <option value="prod-chips-01">Lay's Magic Masala 90g</option>
            <option value="prod-maggi-01">Maggi 2-Minute Noodles 4-pack</option>
          </select>

          <button
            onClick={() => onTriggerPickerOutOfStock(selectedProductId)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            Trigger "Out of Stock" & AI Prompt
          </button>
        </div>
      </div>

      {/* FIFO Perishable Batches Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
            Active Perishable Batches (Sorted by FIFO Priority)
          </h3>
          <span className="text-xs text-stone-600 font-medium">
            Clearance priority: Lower number = dispatch first
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="p-3">Priority</th>
                <th className="p-3">Product</th>
                <th className="p-3">Batch ID</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Days Left</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">MRP / Discounted</th>
                <th className="p-3">Dynamic Markdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {batches.map((b) => (
                <tr key={b.batchId} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3 font-mono font-black text-amber-700">
                    #{b.fifoPriority}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={b.imageUrl}
                        alt={b.productName}
                        className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                      />
                      <div>
                        <p className="font-bold text-stone-900">{b.productName}</p>
                        <p className="text-[10px] text-stone-600">{b.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-stone-600">{b.batchId}</td>
                  <td className="p-3 text-stone-700">{b.expiryDate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        b.daysRemaining <= 1
                          ? 'bg-rose-100 text-rose-800'
                          : b.daysRemaining <= 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {b.daysRemaining} days left
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-800">{b.quantity} pcs</td>
                  <td className="p-3">
                    <span className="font-black text-stone-900">₹{b.discountedPrice}</span>
                    {b.mrp > b.discountedPrice && (
                      <span className="text-[10px] text-stone-600 line-through ml-1.5">
                        ₹{b.mrp}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {[15, 30, 45].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleApplyDiscount(b.batchId, pct)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            b.discountPercent === pct
                              ? 'bg-purple-700 text-white'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
