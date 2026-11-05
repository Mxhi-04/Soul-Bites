import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/layout/Navbar/Navbar";
import { Footer } from "./components/layout/Footer/Footer";
import { MenuCategoryFilter } from "./features/menu/components/MenuCategoryFilter";
import { MenuItemCard } from "./features/menu/components/MenuItemCard";
import { HeroBestsellersInfinite } from "./features/menu/components/HeroBestsellersInfinite";
import { CartDrawer } from "./features/cart/components/CartDrawer";
import { CheckoutModal } from "./features/checkout/components/CheckoutModal";
import { OrderTracker } from "./features/tracking/components/OrderTracker";
import { ShoppingCartIcon } from "./components/ui/Icons/ShoppingCartIcon";
import { CartProvider } from "./features/cart/context/CartContext";
import { useCart } from "./features/cart/hooks/useCart";
import {
  INITIAL_MENU_ITEMS,
  menuService,
} from "./features/menu/services/menuService";
import { MenuItem, MenuCategory } from "./features/menu/types/menuTypes";
import { OrderPreview } from "./features/checkout/types/checkoutTypes";
import {
  restoreOrderPreview,
  clearOrderPreview,
} from "./features/checkout/services/checkoutService";
import { DietaryTag } from "./types";
import { MAX_ITEM_QUANTITY } from "./features/cart/services/cartService";
import styles from "./App.module.css";

const MainContent: React.FC = () => {
  const { pricing, addItem, openCart, items: cartItems } = useCart();

  // Menu State
  const [items, setItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const bestsellers = INITIAL_MENU_ITEMS;
  const [dietaryTag, setDietaryTag] = useState<DietaryTag | "all">("all");
  const [menuError, setMenuError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local order preview state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderPreview | null>(
    restoreOrderPreview,
  );
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    menuService
      .getMenuItems({ category: selectedCategory, searchQuery, dietaryTag })
      .then((result) => {
        if (!cancelled) {
          setItems(result);
          setMenuError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMenuError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, searchQuery, dietaryTag]);

  useEffect(() => {
    if (activeOrder && isTrackerOpen) {
      document.getElementById("order-preview")?.focus({ preventScroll: true });
      document
        .getElementById("order-preview")
        ?.scrollIntoView({ block: "start" });
    }
  }, [activeOrder, isTrackerOpen]);

  const handleAddToCart = (item: MenuItem) => {
    if (
      (cartItems.find((row) => row.item.id === item.id)?.quantity ?? 0) >=
      MAX_ITEM_QUANTITY
    ) {
      setToastMessage(`You can add up to ${MAX_ITEM_QUANTITY} of this item.`);
    } else {
      addItem(item);
      setToastMessage(`Added "${item.name}" to your order!`);
    }
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const handlePreviewSaved = (order: OrderPreview) => {
    setActiveOrder(order);
    setIsTrackerOpen(true);
  };

  return (
    <div className={styles.app}>
      <a className="skip-link" href="#menu">
        Skip to menu
      </a>
      <Navbar
        cartItemCount={pricing.itemCount}
        onOpenCart={openCart}
        hasActiveOrder={Boolean(activeOrder)}
        onOpenTracking={() => setIsTrackerOpen(true)}
      />

      <main className={styles.main}>
        <p className={styles.demoNotice}>
          Explore the Soul Bites demo. Orders and payments are not live yet.
        </p>
        {/* Saved order preview */}
        {activeOrder && isTrackerOpen && (
          <section
            style={{
              padding: "var(--space-xl) 0",
              backgroundColor: "var(--color-charcoal-pure)",
            }}
          >
            <div className="container" style={{ maxWidth: "720px" }}>
              <OrderTracker
                tracking={activeOrder}
                onClose={() => setIsTrackerOpen(false)}
                onClear={() => {
                  clearOrderPreview();
                  setActiveOrder(null);
                  setIsTrackerOpen(false);
                }}
              />
            </div>
          </section>
        )}

        {/* Hero Window: Best Selling Items with Infinite Swiping */}
        <HeroBestsellersInfinite
          items={bestsellers}
          onAddToCart={handleAddToCart}
        />

        {/* Menu Section */}
        <section className={styles.menuSection} id="menu">
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  Explore Our Kitchen Menu
                </h1>
                <p className={styles.sectionDesc}>
                  Explore sample dishes, dietary preferences and preparation
                  estimates.
                </p>
              </div>
            </div>

            <MenuCategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              dietaryTag={dietaryTag}
              onDietaryChange={setDietaryTag}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {menuError ? (
              <p role="alert">The menu could not load. Refresh to try again.</p>
            ) : items.length === 0 ? (
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
        onPreviewSaved={handlePreviewSaved}
      />

      {/* Toast Alert */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {toastMessage && (
          <div className={styles.toast}>
            <ShoppingCartIcon
              size={18}
              color="var(--color-golden-yellow)"
              glow
            />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
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
