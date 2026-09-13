import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { FuzzySearchBar } from './components/FuzzySearchBar.js';
import { Storefront } from './components/Storefront.js';
import { CartDrawer } from './components/CartDrawer.js';
import { OrderTrackingView } from './components/OrderTrackingView.js';
import { ArchitectureTelemetry } from './components/ArchitectureTelemetry.js';
import { DarkStoreAdminPanel } from './components/DarkStoreAdminPanel.js';
import { AISubstitutionModal } from './components/AISubstitutionModal.js';
import { DeliveryPartnerSection } from './components/DeliveryPartnerSection.js';
import { AppView, CartItem, DarkStore, Order, Product } from './types.js';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('storefront');
  const [darkStores, setDarkStores] = useState<DarkStore[]>([]);
  const [activeDarkStore, setActiveDarkStore] = useState<DarkStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // AI Substitution state
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [outOfStockProduct, setOutOfStockProduct] = useState<Product | null>(null);
  const [substituteOptions, setSubstituteOptions] = useState<any[]>([]);

  // Load initial dark stores & products
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [dsRes, prodRes] = await Promise.all([
          fetch('/api/dark-stores?lat=12.9352&lng=77.6245'),
          fetch('/api/products')
        ]);

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          setDarkStores(dsData.all || []);
          setActiveDarkStore(dsData.nearest || dsData.all?.[0] || null);
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }
      } catch (err) {
        console.error('Initial data fetch error:', err);
      }
    }

    loadInitialData();
  }, []);

  // Connect to Server-Sent Events (SSE) for live streaming
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('ai_substitution_alert', (e) => {
      try {
        const data = JSON.parse(e.data);
        setOutOfStockProduct(data.originalProduct);
        setSubstituteOptions(data.substitutes || []);
        setSubstitutionModalOpen(true);
      } catch (err) {
        console.error('SSE substitution parse error:', err);
      }
    });

    eventSource.addEventListener('order_update', (e) => {
      try {
        const updatedOrder = JSON.parse(e.data);
        setActiveOrder((prev) => (prev && prev.id === updatedOrder.id ? updatedOrder : prev));
      } catch (err) {
        console.error('SSE order update parse error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Optimistic Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setCurrentView('tracking');
  };

  // 30-Second Post-Checkout Grace Period: Append forgotten item to active delivery
  const handleAppendForgottenItem = async (productId: string): Promise<boolean> => {
    if (!activeOrder) return false;
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}/append-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOrder(data.order);
        return true;
      }
      alert(data.error || 'Could not append item');
      return false;
    } catch (err) {
      console.error('Append error:', err);
      return false;
    }
  };

  // Trigger dark store picker out of stock simulation
  const handleTriggerPickerOutOfStock = async (productId: string) => {
    try {
      const res = await fetch('/api/picker/out-of-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      setOutOfStockProduct(data.originalProduct);
      setSubstituteOptions(data.substitutes || []);
      setSubstitutionModalOpen(true);
    } catch (err) {
      console.error('Trigger picker error:', err);
    }
  };

  // Customer accepts AI substitute
  const handleAcceptSubstitute = async (origId: string, subId: string) => {
    if (activeOrder) {
      try {
        const res = await fetch(`/api/orders/${activeOrder.id}/accept-substitute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalProductId: origId, substituteProductId: subId })
        });
        const data = await res.json();
        if (data.order) setActiveOrder(data.order);
      } catch (err) {
        console.error('Accept substitute error:', err);
      }
    }
    setSubstitutionModalOpen(false);
  };

  const [dbStatus, setDbStatus] = useState<any>(null);

  // Check MongoDB status
  useEffect(() => {
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.warn('DB status check notice:', err));
  }, []);

  const cartTotal = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fefce8] text-stone-900 selection:bg-yellow-300">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        darkStores={darkStores}
        activeDarkStore={activeDarkStore}
        onSelectDarkStore={(ds) => setActiveDarkStore(ds)}
        hasActiveOrder={!!activeOrder}
        dbStatus={dbStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {currentView === 'storefront' && (
          <div className="space-y-6">
            {/* Sub-50ms Instant Search with Fuzzy Typo Tolerance */}
            <FuzzySearchBar
              onSelectProduct={(p) => {
                handleAddToCart(p);
                setIsCartOpen(true);
              }}
            />

            {/* Product Catalog & Flash Sales */}
            <Storefront
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              activeDarkStore={activeDarkStore}
              onRunConcurrencyTest={() => setCurrentView('architecture')}
              onOpenCart={() => setIsCartOpen(true)}
              onJoinAsPartner={() => setCurrentView('partner-join')}
            />
          </div>
        )}

        {currentView === 'tracking' && activeOrder && (
          <OrderTrackingView
            order={activeOrder}
            onAppendForgottenItem={handleAppendForgottenItem}
            availableAddons={products.filter((p) => p.category === 'essentials' || p.category === 'snacks')}
            onTriggerOutOfStockPickerSimulation={handleTriggerPickerOutOfStock}
          />
        )}

        {currentView === 'partner-join' && (
          <DeliveryPartnerSection
            darkStores={darkStores}
            onBackToStore={() => setCurrentView('storefront')}
          />
        )}

        {currentView === 'architecture' && (
          <ArchitectureTelemetry />
        )}

        {currentView === 'darkstore-ops' && (
          <DarkStoreAdminPanel
            onTriggerPickerOutOfStock={handleTriggerPickerOutOfStock}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        activeDarkStore={activeDarkStore}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* AI Item Substitution Urgent Dialog (60s Window) */}
      <AISubstitutionModal
        isOpen={substitutionModalOpen}
        onClose={() => setSubstitutionModalOpen(false)}
        originalProduct={outOfStockProduct}
        substitutes={substituteOptions}
        onAcceptSubstitute={handleAcceptSubstitute}
      />
    </div>
  );
}

export default App;
