# Soul Bites — Feature-to-File Project Map

This project map links every business feature directly to its responsible files, components, services, and types. Use this map to navigate directly to target files without broad codebase scans.

---

## 1. Feature Map

### 1. Brand Identity, Styling & Tokens
- **Tokens & Palette**: [tokens.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/styles/tokens.css) (Charcoal Black `#1C1C1C`, Golden Yellow `#F5B700`, Cream White `#FFF8E6`, Background Pattern tokens)
- **Background Pattern Asset**: [pattern.png](file:///Users/mahipatni/Antigravity/soul%20bites%20website/public/images/pattern.png) (Seamless transparent food doodle overlay)
- **Global Reset & Base**: [globals.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/styles/globals.css)
- **Palette Constants**: [theme.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/constants/theme.ts)
- **Business Constants & Hours**: [config.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/constants/config.ts)

### 2. Header, Navigation & Global Layout
- **Navbar Component**: [Navbar.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/layout/Navbar/Navbar.tsx)
- **Navbar Styling**: [Navbar.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/layout/Navbar/Navbar.module.css)
- **Footer Component**: [Footer.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/layout/Footer/Footer.tsx)
- **Footer Styling**: [Footer.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/layout/Footer/Footer.module.css)
- **App Shell & Hero**: [App.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/App.tsx), [App.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/App.module.css)

### 3. Menu Browsing, Filtering & Dish Details
- **Hero Bestsellers Infinite Window**: [HeroBestsellersInfinite.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/HeroBestsellersInfinite.tsx)
- **Hero Bestsellers Styling**: [HeroBestsellersInfinite.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/HeroBestsellersInfinite.module.css)
- **Bestsellers Carousel**: [BestsellersCarousel.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/BestsellersCarousel.tsx)
- **Carousel Styling & Pop Animations**: [BestsellersCarousel.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/BestsellersCarousel.module.css)
- **Menu Items Card**: [MenuItemCard.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/MenuItemCard.tsx)
- **Card Styling**: [MenuItemCard.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/MenuItemCard.module.css)
- **Category & Search Filter**: [MenuCategoryFilter.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/MenuCategoryFilter.tsx)
- **Filter Styling**: [MenuCategoryFilter.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/components/MenuCategoryFilter.module.css)
- **Menu Data Service**: [menuService.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/services/menuService.ts)
- **Menu Type Contracts**: [menuTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/types/menuTypes.ts)

### 4. Shopping Cart & Price Calculation
- **Cart Slide-out Drawer**: [CartDrawer.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/cart/components/CartDrawer.tsx)
- **Drawer Styling**: [CartDrawer.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/cart/components/CartDrawer.module.css)
- **Cart State & Calculations**: [CartContext.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/cart/context/CartContext.tsx)
- **Cart Type Contracts**: [cartTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/cart/types/cartTypes.ts)

### 5. Checkout & Delivery Address Form
- **Checkout Dialog**: [CheckoutModal.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/checkout/components/CheckoutModal.tsx)
- **Checkout Styling**: [CheckoutModal.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/checkout/components/CheckoutModal.module.css)
- **Form Validation**: [checkoutValidation.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/checkout/validation/checkoutValidation.ts)
- **Checkout Type Contracts**: [checkoutTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/checkout/types/checkoutTypes.ts)

### 6. Order Tracking & Kitchen Simulation
- **Order Tracker Component**: [OrderTracker.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/tracking/components/OrderTracker.tsx)
- **Tracker Styling**: [OrderTracker.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/tracking/components/OrderTracker.module.css)
- **Tracking Type Contracts**: [trackingTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/tracking/types/trackingTypes.ts)

### 7. Reusable UI Primitives
- **Button Primitives**: [Button.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Button/Button.tsx), [Button.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Button/Button.module.css)
- **Dietary Badges**: [Badge.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Badge/Badge.tsx), [Badge.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Badge/Badge.module.css)
- **Accessible Modal**: [Modal.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Modal/Modal.tsx), [Modal.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Modal/Modal.module.css)
- **Brand SVG Icons**: [ShoppingCartIcon.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Icons/ShoppingCartIcon.tsx)

### 8. Shared Helpers & Core Models
- **Formatters (Currency, ETA)**: [formatters.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/utils/formatters.ts)
- **Local Storage Helper**: [storage.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/utils/storage.ts)
- **Global Type Definitions**: [index.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/types/index.ts)

---

## 2. Common Agent Modification Tasks & Target Files

- **"Change the delivery fee or threshold"**: Edit [config.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/constants/config.ts)
- **"Add a new food category or menu item"**: Edit [menuService.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/services/menuService.ts) and [menuTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/menu/types/menuTypes.ts)
- **"Adjust the color palette or button styling"**: Edit [tokens.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/styles/tokens.css) and [Button.module.css](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/components/ui/Button/Button.module.css)
- **"Change checkout validation rules"**: Edit [checkoutValidation.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/checkout/validation/checkoutValidation.ts)
- **"Add a new step to order tracking"**: Edit [trackingTypes.ts](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/tracking/types/trackingTypes.ts) and [OrderTracker.tsx](file:///Users/mahipatni/Antigravity/soul%20bites%20website/src/features/tracking/components/OrderTracker.tsx)
