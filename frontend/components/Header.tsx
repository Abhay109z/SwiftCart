import React from 'react';
import {
  Zap,
  MapPin,
  ShoppingBag,
  Boxes,
  Compass,
  ChevronDown,
  Bike
} from 'lucide-react';
import { AppView, DarkStore } from '../types.js';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  darkStores: DarkStore[];
  activeDarkStore: DarkStore | null;
  onSelectDarkStore: (store: DarkStore) => void;
  hasActiveOrder: boolean;
  dbStatus?: any;
  backendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  cartCount,
  cartTotal,
  onOpenCart,
  darkStores,
  activeDarkStore,
  onSelectDarkStore,
  hasActiveOrder,
  dbStatus,
  backendConnected = true
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-yellow-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand & 10-Min Promise Badge */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => onViewChange('storefront')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-stone-950 font-black shadow-sm group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-stone-900">SwiftCart</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wide">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Delivery in 8-10 Mins</span>
                </div>
              </div>
            </button>

            {/* Render Backend Connection Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200/80 shadow-2xs"
              title="Connected to Render Backend (https://swiftcart-wjbj.onrender.com)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-semibold text-stone-700">Backend:</span>
              <span className="text-emerald-700 font-bold">{backendConnected ? 'Render Online' : 'Connecting...'}</span>
            </div>

            {/* Hyper-Local Delivery Location Selector */}
            <div className="hidden lg:flex items-center ml-2 pl-3 border-l border-stone-200">
              <div className="relative group">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <div className="text-left">
                    <p className="text-[10px] text-stone-500 font-semibold leading-tight">Delivering to</p>
                    <p className="font-bold text-stone-900 truncate max-w-[180px]">
                      {activeDarkStore?.name || 'Koramangala Hub'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-600 ml-1" />
                </div>

                {/* Dropdown to switch locations */}
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-stone-200 p-2 hidden group-hover:block z-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-2 py-1">
                    Select Delivery Location
                  </p>
                  {darkStores.map((ds) => (
                    <button
                      key={ds.id}
                      onClick={() => onSelectDarkStore(ds)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        activeDarkStore?.id === ds.id
                          ? 'bg-amber-50 text-amber-900 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-stone-900">{ds.name}</p>
                        <p className="text-[10px] text-stone-500">{ds.coverageRadiusKm} km radius</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                        ⚡ 8-10m
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nav Switcher */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-storefront-btn"
              onClick={() => onViewChange('storefront')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'storefront'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Store</span>
            </button>

            {hasActiveOrder && (
              <button
                id="nav-tracking-btn"
                onClick={() => onViewChange('tracking')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentView === 'tracking'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Compass className="w-4 h-4 animate-spin text-amber-900" style={{ animationDuration: '6s' }} />
                <span>Track Order</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
              </button>
            )}

            <button
              id="nav-partner-join-btn"
              onClick={() => onViewChange('partner-join')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'partner-join'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-amber-900 bg-amber-100/80 hover:bg-amber-200'
              }`}
            >
              <Bike className="w-4 h-4 text-amber-950" />
              <span className="hidden sm:inline">Join as Delivery Partner</span>
              <span className="sm:hidden">Deliver</span>
            </button>

            <button
              id="nav-darkstore-ops-btn"
              onClick={() => onViewChange('darkstore-ops')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'darkstore-ops'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
              title="Warehouse Inventory & Expiry Tracker"
            >
              <Boxes className="w-4 h-4" />
              <span className="hidden lg:inline">Warehouse Ops</span>
            </button>
          </nav>

          {/* Cart Button with Optimistic Badge */}
          <div className="flex items-center gap-2">
            <button
              id="open-cart-btn"
              onClick={onOpenCart}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-stone-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-emerald-600">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="text-left font-bold">
                {cartCount > 0 ? (
                  <span>₹{cartTotal}</span>
                ) : (
                  <span>Cart</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
