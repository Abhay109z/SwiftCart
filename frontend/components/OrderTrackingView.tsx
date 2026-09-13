import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Package,
  Plus,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Order, Product } from '../types.js';
import { getApiUrl } from '../apiConfig.js';

interface OrderTrackingViewProps {
  order: Order;
  onAppendForgottenItem: (productId: string) => Promise<boolean>;
  availableAddons: Product[];
  onTriggerOutOfStockPickerSimulation: (productId: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  order,
  onAppendForgottenItem,
  availableAddons,
  onTriggerOutOfStockPickerSimulation
}) => {
  const [trackingData, setTrackingData] = useState<{
    remainingTimeFormatted: string;
    progressFraction: number;
    riderCurrentLocation: { lat: number; lng: number; remainingMeters: number };
    gracePeriodRemainingSeconds: number;
    status: string;
  }>({
    remainingTimeFormatted: '08:45',
    progressFraction: 0.15,
    riderCurrentLocation: { lat: 12.9355, lng: 77.6248, remainingMeters: 850 },
    gracePeriodRemainingSeconds: Math.max(0, Math.floor((order.gracePeriodEndsAt - Date.now()) / 1000)),
    status: order.status
  });

  const [isAppending, setIsAppending] = useState(false);
  const [appendSuccessMessage, setAppendSuccessMessage] = useState<string | null>(null);

  // Poll live tracking telemetry every 1 second
  useEffect(() => {
    let isMounted = true;

    const fetchTracking = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/orders/${order.id}/tracking`));
        if (res.ok && isMounted) {
          const data = await res.json();
          setTrackingData({
            remainingTimeFormatted: data.remainingTimeFormatted,
            progressFraction: data.progressFraction,
            riderCurrentLocation: data.riderCurrentLocation,
            gracePeriodRemainingSeconds: data.gracePeriodRemainingSeconds,
            status: data.status
          });
        }
      } catch (err) {
        console.error('Tracking fetch error:', err);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [order.id]);

  const handleQuickAdd = async (productId: string) => {
    setIsAppending(true);
    const success = await onAppendForgottenItem(productId);
    setIsAppending(false);
    if (success) {
      setAppendSuccessMessage('Successfully appended item to active delivery at ₹0 extra fee!');
      setTimeout(() => setAppendSuccessMessage(null), 4000);
    }
  };

  const steps = [
    { label: 'Order Confirmed', time: '0m', done: true },
    { label: 'Packed at DarkStore', time: '2m', done: trackingData.progressFraction >= 0.2 },
    { label: 'Rider Dispatched', time: '4m', done: trackingData.progressFraction >= 0.35 },
    { label: 'Out for Delivery', time: '6m', done: trackingData.progressFraction >= 0.5 },
    { label: 'Arriving at Doorstep', time: '9m', done: trackingData.progressFraction >= 0.95 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 30-Second Post-Checkout Grace Period Banner */}
      {trackingData.gracePeriodRemainingSeconds > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 p-4 rounded-2xl shadow-lg border border-amber-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-mono font-black text-sm shadow">
              {trackingData.gracePeriodRemainingSeconds}s
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-stone-950 fill-current" />
                <h3 className="font-extrabold text-sm text-stone-950">
                  Post-Checkout 30-Second Grace Period Active!
                </h3>
              </div>
              <p className="text-xs text-stone-900 font-medium">
                Forgot something? Add items into your active rider tote with <span className="font-black underline">₹0 extra delivery fee</span>!
              </p>
            </div>
          </div>

          {/* Quick-add add-on items */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
            {availableAddons.slice(0, 3).map((addon) => (
              <button
                key={addon.id}
                onClick={() => handleQuickAdd(addon.id)}
                disabled={isAppending}
                className="flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add {addon.name.split(' ')[0]}</span>
                <span className="text-amber-300 font-mono">₹{addon.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {appendSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{appendSuccessMessage}</span>
        </div>
      )}

      {/* Main Delivery Tracking Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden">
        {/* Live Vector Radar & Map Simulator */}
        <div className="relative h-64 sm:h-72 bg-stone-900 overflow-hidden">
          {/* Subtle grid pattern resembling city street grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#64748b 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              backgroundPosition: '0 0, 16px 16px'
            }}
          />

          {/* SVG Map Path & Pins */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
            {/* Street route lines */}
            <path
              d="M 120 180 Q 280 80 440 160 T 700 120"
              fill="none"
              stroke="#334155"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Active GPS delivery polyline */}
            <path
              d="M 120 180 Q 280 80 440 160 T 700 120"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </svg>

          {/* Dark Store Origin Pin */}
          <div className="absolute left-[12%] top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg border-2 border-white">
              <Package className="w-5 h-5" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-stone-950/80 text-[10px] font-medium text-white border border-stone-800">
              Store Hub
            </span>
          </div>

          {/* Customer Destination Pin */}
          <div className="absolute left-[88%] top-[38%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white animate-bounce">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-stone-950/80 text-[10px] font-medium text-white border border-stone-800">
              Your Address
            </span>
          </div>

          {/* Live Rider Marker Moving along progressFraction */}
          {(() => {
            const startX = 12;
            const endX = 88;
            const riderX = startX + (endX - startX) * trackingData.progressFraction;
            const riderY = 55 - Math.sin(trackingData.progressFraction * Math.PI) * 18;

            return (
              <div
                className="absolute flex flex-col items-center transition-all duration-1000 ease-linear z-20"
                style={{
                  left: `${riderX}%`,
                  top: `${riderY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-2xl">
                    <span className="text-xl">🛵</span>
                  </div>
                  {/* Radar pulse ring */}
                  <span className="absolute -inset-2 rounded-2xl border-2 border-amber-400/50 animate-ping pointer-events-none" />
                </div>
                <div className="mt-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold font-mono shadow">
                  {trackingData.riderCurrentLocation.remainingMeters}m away
                </div>
              </div>
            );
          })()}

          {/* Floating Live Telemetry Overlay */}
          <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md rounded-2xl p-3 border border-stone-800 text-white flex items-center gap-3 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex flex-col items-center justify-center font-black">
              <span className="text-[10px] uppercase tracking-tighter leading-none">ETA</span>
              <span className="text-sm font-mono leading-none mt-0.5">
                {trackingData.remainingTimeFormatted}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Delivery</span>
              </div>
              <p className="text-[11px] text-stone-300">
                Delivery partner is on the way
              </p>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 text-[11px] font-medium text-emerald-400">
            Order #{order.id.slice(-6).toUpperCase()}
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="p-5 border-b border-stone-200 bg-stone-50">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {steps.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className="text-[11px] font-mono text-stone-600">{s.time}</span>
                </div>
                <p className="text-xs font-bold text-stone-900 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rider & Tote Details */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Rider Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={order.rider?.avatar}
                alt={order.rider?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-stone-900">{order.rider?.name}</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ⭐ {order.rider?.rating}
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  {order.rider?.vehicle} • {order.rider?.vehicleNumber}
                </p>
                <p className="text-[11px] text-stone-600 font-mono mt-0.5">
                  {order.rider?.deliveriesCompleted} deliveries completed
                </p>
              </div>
            </div>

            <button
              onClick={() => alert(`Calling delivery partner ${order.rider?.name}...`)}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-colors cursor-pointer"
              title="Call Delivery Partner"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Fulfilled by:</span>
              <span className="font-semibold text-stone-900">{order.darkStoreName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Items:</span>
              <span className="text-stone-900 font-semibold">{order.items.length} items</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Total Paid:</span>
              <span className="font-black text-emerald-700 text-sm">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Substituted Items alert if any were replaced */}
        {order.substitutedItems && order.substitutedItems.length > 0 && (
          <div className="mx-5 mb-5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
            <p className="font-bold text-purple-900">Item Replacement Applied:</p>
            {order.substitutedItems.map((sub, i) => (
              <p key={i} className="text-purple-800 text-[11px] mt-0.5">
                • {sub.originalItem} was replaced with <strong>{sub.substituteItem}</strong> ({sub.reason})
              </p>
            ))}
          </div>
        )}

        {/* Order Items Snapshot */}
        <div className="p-5 border-t border-stone-200 bg-white">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
            Items in this Delivery
          </h4>
          <div className="divide-y divide-stone-100">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={it.imageUrl}
                    alt={it.productName}
                    className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                  />
                  <div>
                    <p className="font-bold text-stone-900">{it.productName}</p>
                    <p className="text-[11px] text-stone-600">
                      {it.quantity} × ₹{it.unitPrice} ({it.unit})
                    </p>
                  </div>
                </div>
                <span className="font-bold text-stone-900">₹{it.totalPrice}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
