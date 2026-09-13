import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Zap,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Lock
} from 'lucide-react';
import { CartItem, DarkStore, Order } from '../types.js';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (product: CartItem['product']) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  activeDarkStore: DarkStore | null;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  activeDarkStore,
  onOrderPlaced
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  );

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const deliveryFee = 15;
  const handlingFee = 4;
  const surgeFee = activeDarkStore?.status === 'surge' ? 15 : 0;
  const totalAmount = subtotal + deliveryFee + handlingFee + surgeFee;

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity
        })),
        customerName: 'Karthik Rao',
        customerAddress: 'Flat 402, Green Glen Heights, Koramangala 4th Block',
        userLat: 12.9352,
        userLng: 77.6245,
        darkStoreId: activeDarkStore?.id || 'ds-blr-01'
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      onClearCart();
      onClose();
      onOrderPlaced(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout encountered an error';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">Your SwiftCart</h2>
                <p className="text-[11px] text-stone-600">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items • Delivers in 8-10 mins
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-600 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Promise Banner */}
          <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>10-Minute Express Delivery</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              ⚡ 8-10 Mins ETA
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-stone-800">Your basket is empty</p>
                <p className="text-xs text-stone-600 mt-1 max-w-xs">
                  Browse fresh milk, bakery goods, and munchies. We deliver in under 10 minutes!
                </p>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-all shadow-2xs"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover bg-stone-50 border border-stone-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{product.name}</p>
                    <p className="text-[11px] text-stone-600">{product.unit}</p>
                    <p className="text-xs font-black text-stone-900 mt-0.5">
                      ₹{product.price * quantity}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                    <button
                      onClick={() => onRemoveFromCart(product.id)}
                      className="p-1 hover:bg-stone-200 text-stone-700 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black text-stone-900 min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="p-1 hover:bg-stone-200 text-stone-700 transition-colors"
                      disabled={quantity >= product.currentStock}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Delivery Address Card */}
            {cart.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivering to</span>
                </div>
                <p className="text-stone-600 text-[11px] pl-5">
                  Flat 402, Green Glen Heights, Koramangala (1.1 km away)
                </p>
              </div>
            )}
          </div>

          {/* Bill Summary & Slide to Checkout */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Item Total</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Delivery Partner Fee</span>
                  <span className="text-emerald-700 font-bold">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Handling & Eco Bag</span>
                  <span>₹{handlingFee}</span>
                </div>
                {surgeFee > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>High Demand Delivery Surge</span>
                    <span>₹{surgeFee}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
                  <span>To Pay</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {/* Instant Checkout Button */}
              <button
                id="place-order-button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{isSubmitting ? 'Placing Order...' : 'Place 10-Min Order'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono">₹{totalAmount}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
