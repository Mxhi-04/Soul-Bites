import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Navbar } from "./components/layout/Navbar/Navbar";
import { Footer } from "./components/layout/Footer/Footer";
import { MenuCategoryFilter } from "./features/menu/components/MenuCategoryFilter";
import { MenuItemCard } from "./features/menu/components/MenuItemCard";
import { HeroBestsellersInfinite } from "./features/menu/components/HeroBestsellersInfinite";
import { useAuth } from "./features/auth/context/authContext";
import { accountStorageKey } from "./utils/storage";
import { CART_STORAGE_KEY } from "./features/cart/services/cartService";
import { LandingHero } from "./features/landing/components/LandingHero";
import { KitchenPicks } from "./features/landing/components/KitchenPicks";
import { LandingQuestions } from "./features/landing/components/LandingQuestions";
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
  PREVIEW_STORAGE_KEY,
  clearOrderPreview,
} from "./features/checkout/services/checkoutService";
import { DietaryTag } from "./types";
import { MAX_ITEM_QUANTITY } from "./features/cart/services/cartService";
import styles from "./App.module.css";

const kitchenPicks = ["sb-01", "sb-05", "sb-03"].flatMap((id) => {
  const item = menuService.getItemById(id);
  return item ? [item] : [];
});
const smashBurger = menuService.getItemById("sb-01");
const LoginPage = lazy(() => import("./features/auth/components/LoginPage"));

const MainContent: React.FC<{ accountId?: string }> = ({ accountId }) => {
  const previewKey = accountStorageKey(PREVIEW_STORAGE_KEY, accountId);
  const { pricing, addItem, openCart, items: cartItems } = useCart();

  useEffect(() => {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: "instant" });
  }, []);

  // Menu State
  const [items, setItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [dietaryTag, setDietaryTag] = useState<DietaryTag | "all">("all");
  const [menuError, setMenuError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local order preview state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<OrderPreview | null>(() =>
    restoreOrderPreview(previewKey),
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
        signedIn={Boolean(accountId)}
        onOpenCart={openCart}
        hasActiveOrder={Boolean(activeOrder)}
        onOpenTracking={() => setIsTrackerOpen(true)}
      />

      <main className={styles.main}>
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
                  clearOrderPreview(previewKey);
                  setActiveOrder(null);
                  setIsTrackerOpen(false);
                }}
              />
            </div>
          </section>
        )}

        {smashBurger && (
          <LandingHero
            item={smashBurger}
            onAdd={() => handleAddToCart(smashBurger)}
          />
        )}
        <section
          id="featured"
          className={styles.featured}
          aria-labelledby="featured-title"
        >
          <div className={styles.featuredHeader}>
            <div>
              <p className={styles.sectionLabel}>Featured dishes</p>
              <h2 id="featured-title" className={styles.sectionTitle}>
                Pick your favorite.
              </h2>
            </div>
            <p>Scroll or swipe to explore the featured dishes.</p>
          </div>
          <HeroBestsellersInfinite
            initialItemId="sb-05"
            onAddToCart={handleAddToCart}
          />
        </section>
        <KitchenPicks items={kitchenPicks} onAdd={handleAddToCart} />

        {/* Menu Section */}
        <section className={styles.menuSection} id="menu">
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.sectionLabel}>02 / The full menu</p>
                <h2 className={styles.sectionTitle}>Find your bite.</h2>
                <p className={styles.sectionDesc}>
                  Browse sample dishes, check the ingredients and build an order
                  preview.
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
        <LandingQuestions />
      </main>

      <Footer />

      {/* Cart & Checkout */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPreviewSaved={handlePreviewSaved}
        storageKey={previewKey}
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
  const { status, user } = useAuth();
  const waiting = (
    <main className={styles.loading} role="status">
      Loading Soul Bites…
    </main>
  );
  if (/^\/login\/?$/.test(window.location.pathname)) {
    return (
      <Suspense fallback={waiting}>
        <LoginPage />
      </Suspense>
    );
  }
  if (status === "loading") return waiting;

  const cartKey = accountStorageKey(CART_STORAGE_KEY, user?.id);
  return (
    <CartProvider key={cartKey} storageKey={cartKey}>
      <MainContent accountId={user?.id} />
    </CartProvider>
  );
};

export default App;
