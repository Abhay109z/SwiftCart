import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Bike
} from 'lucide-react';
import { CartItem, DarkStore, Product } from '../types.js';

interface StorefrontProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  activeDarkStore: DarkStore | null;
  onRunConcurrencyTest: () => void;
  onOpenCart: () => void;
  onJoinAsPartner?: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({
  products,
  cart,
  onAddToCart,
  onRemoveFromCart,
  activeDarkStore,
  onRunConcurrencyTest,
  onOpenCart,
  onJoinAsPartner
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Items', icon: '🛒' },
    { id: 'dairy', label: 'Dairy & Breakfast', icon: '🥛' },
    { id: 'bakery', label: 'Bakery & Bread', icon: '🍞' },
    { id: 'produce', label: 'Fresh Fruits & Veg', icon: '🍎' },
    { id: 'snacks', label: 'Munchies & Snacks', icon: '🍿' },
    { id: 'beverages', label: 'Cold Drinks & Juices', icon: '🥤' },
    { id: 'essentials', label: 'Quick Essentials', icon: '⚡' }
  ];

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const getItemCartQty = (productId: string): number => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Find flash rush product for the hero banner
  const flashProduct = products.find((p) => p.id === 'prod-milk-flash-02');

  return (
    <div className="space-y-6 pb-20">
      {/* Customer Quick-Commerce Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 sm:p-7 shadow-lg border border-stone-800">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-stone-950">
              <Zap className="w-3.5 h-3.5 fill-current" />
              10-MINUTE GROCERY DELIVERY
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-stone-200 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% Fresh & Authentic Guarantee
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white mt-1">
            Groceries Delivered Fresh to Your Doorstep in 10 Minutes
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed max-w-2xl">
            Farm-fresh dairy, artisan bread, crisp fruits, snacks, and daily household essentials picked from your nearest local hub and delivered instantly.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedCategory('dairy')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Shop Dairy & Essentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {flashProduct && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
                <span className="text-amber-300 font-bold">Today's Flash Deal:</span>
                <span className="text-white font-medium">{flashProduct.name}</span>
                <span className="font-bold text-amber-300">₹{flashProduct.price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:flex items-center justify-center">
          <Zap className="w-64 h-64 text-amber-400" />
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 shadow-sm scale-[1.02]'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Dark Store & Delivery Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-stone-900">
            Delivering from {activeDarkStore?.name || 'Koramangala 4th Block Hub'}
          </span>
          <span className="text-stone-600 font-medium">
            (Approx 1.1 km • 8-10 mins ETA)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Fresh & Handpicked
          </span>
          <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            ⚡ 10-Min Fast Delivery
          </span>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredProducts.map((product) => {
          const qtyInCart = getItemCartQty(product.id);
          const isLowStock = product.currentStock > 0 && product.currentStock <= 5;
          const isOutOfStock = product.currentStock <= 0;

          // Check for best batch discount
          const lowestBatch = product.batches?.reduce(
            (prev, curr) => (curr.discountPercent > prev.discountPercent ? curr : prev),
            product.batches[0]
          );

          return (
            <div
              key={product.id}
              className={`group flex flex-col justify-between bg-white rounded-2xl border p-3 shadow-sm hover:shadow-md transition-all relative ${
                product.id === 'prod-milk-flash-02'
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Badges: Deal or Delivery Speed */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                {product.id === 'prod-milk-flash-02' ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 shadow-sm flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    HOT DEAL
                  </span>
                ) : lowestBatch && lowestBatch.discountPercent >= 20 ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-sm flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {lowestBatch.discountPercent}% OFF
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-900/80 text-white backdrop-blur-xs flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    8-10m
                  </span>
                )}

                {isLowStock && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Only {product.currentStock} left!
                  </span>
                )}
              </div>

              {/* Product Image */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-50 mb-2.5 border border-stone-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 text-center">
                    <span className="text-white text-xs font-extrabold uppercase tracking-wider bg-rose-600 px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1 flex-1">
                <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                  {product.brand}
                </p>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug">
                  {product.name}
                </h3>
                <p className="text-[11px] text-stone-600 font-medium">
                  {product.unit}
                </p>
              </div>

              {/* Price & Add Button */}
              <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-stone-900">
                      ₹{product.price}
                    </span>
                    {product.mrp > product.price && (
                      <span className="text-[11px] text-stone-600 line-through">
                        ₹{product.mrp}
                      </span>
                    )}
                  </div>
                </div>

                {isOutOfStock ? (
                  <button
                    disabled
                    className="px-3 py-1.5 bg-stone-200 text-stone-600 text-xs font-bold rounded-lg cursor-not-allowed"
                  >
                    Sold
                  </button>
                ) : qtyInCart === 0 ? (
                  <button
                    id={`add-to-cart-${product.id}`}
                    onClick={() => onAddToCart(product)}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-600 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    ADD
                  </button>
                ) : (
                  <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-xs overflow-hidden">
                    <button
                      onClick={() => onRemoveFromCart(product.id)}
                      className="px-2 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black min-w-[20px] text-center">
                      {qtyInCart}
                    </span>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="px-2 py-1.5 hover:bg-emerald-700 transition-colors cursor-pointer"
                      title="Increase"
                      disabled={qtyInCart >= product.currentStock}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Join as Delivery Partner Section Banner */}
      {onJoinAsPartner && (
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-6 sm:p-8 text-stone-950 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-stone-950 text-amber-400 flex items-center justify-center font-black flex-shrink-0 shadow-lg">
              <Bike className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-950/10 text-stone-900 text-[10px] font-bold uppercase tracking-wider mb-1">
                Now Hiring Riders Across Bengaluru
              </div>
              <h3 className="text-lg sm:text-xl font-black text-stone-950">
                Want to Deliver with SwiftCart & Earn up to ₹35,000/Month?
              </h3>
              <p className="text-xs sm:text-sm text-stone-800 font-medium mt-0.5">
                Enjoy flexible shifts, weekly payouts directly to your bank account, and ₹5 Lakh medical insurance.
              </p>
            </div>
          </div>

          <button
            onClick={onJoinAsPartner}
            className="w-full sm:w-auto px-6 py-3 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 flex-shrink-0"
          >
            <span>Apply as Delivery Partner</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      )}
    </div>
  );
};
