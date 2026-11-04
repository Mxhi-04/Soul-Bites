import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar/Navbar';
import { Footer } from './components/layout/Footer/Footer';
import { MenuCategoryFilter } from './features/menu/components/MenuCategoryFilter';
import { MenuItemCard } from './features/menu/components/MenuItemCard';
import { HeroBestsellersInfinite } from './features/menu/components/HeroBestsellersInfinite';
import { CartDrawer } from './features/cart/components/CartDrawer';
import { CheckoutModal } from './features/checkout/components/CheckoutModal';
import { OrderTracker } from './features/tracking/components/OrderTracker';
import { ShoppingCartIcon } from './components/ui/Icons/ShoppingCartIcon';
import { CartProvider, useCart } from './features/cart/context/CartContext';
import { menuService } from './features/menu/services/menuService';
import { MenuItem, MenuCategory } from './features/menu/types/menuTypes';
import { PlacedOrder } from './features/checkout/types/checkoutTypes';
import { OrderTrackingState } from './features/tracking/types/trackingTypes';
import styles from './App.module.css';

const MainContent: React.FC = () => {
  const { pricing, addItem, openCart } = useCart();

  // Menu State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [bestsellers, setBestsellers] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    menuService.getMenuItems().then(setBestsellers);
  }, []);

  // Checkout & Order Tracking State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderTrackingState | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  useEffect(() => {
    menuService
      .getMenuItems({ category: selectedCategory, searchQuery })
      .then(setItems);
  }, [selectedCategory, searchQuery]);

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    setToastMessage(`Added "${item.name}" to your order!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOrderPlaced = (order: PlacedOrder) => {
    const trackingState: OrderTrackingState = {
      orderId: order.orderId,
      currentStep: 'received',
      estimatedArrivalMinutes: order.estimatedArrivalMinutes,
      deliveryAddress: order.deliveryAddress,
      placedAt: order.placedAt,
    };
    setActiveOrder(trackingState);
    setIsTrackerOpen(true);
  };

  const handleAdvanceTracking = () => {
    if (!activeOrder) return;
    const stepOrder: OrderTrackingState['currentStep'][] = [
      'received',
      'preparing',
      'dispatched',
      'delivered',
    ];
    const currentIndex = stepOrder.indexOf(activeOrder.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setActiveOrder({
        ...activeOrder,
        currentStep: stepOrder[currentIndex + 1],
        estimatedArrivalMinutes: Math.max(0, activeOrder.estimatedArrivalMinutes - 8),
      });
    }
  };

  return (
    <div className={styles.app}>
      <Navbar
        cartItemCount={pricing.itemCount}
        onOpenCart={openCart}
        hasActiveOrder={Boolean(activeOrder)}
        onOpenTracking={() => setIsTrackerOpen(true)}
      />

      <main className={styles.main}>
        {/* Live Order Tracker Modal / Section */}
        {activeOrder && isTrackerOpen && (
          <section style={{ padding: 'var(--space-xl) 0', backgroundColor: 'var(--color-charcoal-pure)' }}>
            <div className="container" style={{ maxWidth: '720px' }}>
              <OrderTracker
                tracking={activeOrder}
                onAdvanceStatus={handleAdvanceTracking}
                onClose={() => setIsTrackerOpen(false)}
              />
            </div>
          </section>
        )}

        {/* Hero Window: Best Selling Items with Infinite Swiping */}
        <HeroBestsellersInfinite items={bestsellers} onAddToCart={handleAddToCart} />

        {/* Menu Section */}
        <section className={styles.menuSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Explore Our Kitchen Menu</h2>
                <p className={styles.sectionDesc}>
                  Every item is made to order with chef-selected ingredients.
                </p>
              </div>
            </div>

            <MenuCategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {items.length === 0 ? (
              <div className={styles.emptyResults}>
                <h3>No bites match your criteria</h3>
                <p>Try searching for burgers, bowls, or fries.</p>
              </div>
            ) : (
              <div className={styles.menuGrid}>
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Cart & Checkout */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalAmount={pricing.total}
        itemsCount={pricing.itemCount}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <ShoppingCartIcon size={18} color="var(--color-golden-yellow)" glow />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
};

export default App;
