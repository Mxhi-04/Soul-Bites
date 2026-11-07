# Soul Bites — Feature-to-File Project Map

This project map links every business feature directly to its responsible files, components, services, and types. Use this map to navigate directly to target files without broad codebase scans.

---

## 1. Feature Map

### 1. Brand Identity, Styling & Tokens
- **Brand Logo Asset**: [soul_bites_logo.png](../public/images/soul_bites_logo.png) (Official Soul Bites mascot & typography logo)
- **Tokens & Palette**: [tokens.css](../src/styles/tokens.css) (Charcoal Black `#1C1C1C`, Golden Yellow `#F5B700`, Cream White `#FFF8E6`, Background Pattern tokens)
- **Background Pattern Asset**: [pattern.png](../public/images/pattern.png) (Seamless transparent food doodle overlay)
- **Global Reset & Base**: [globals.css](../src/styles/globals.css)
- **Palette Constants**: [theme.ts](../src/constants/theme.ts)
- **Business Constants & Hours**: [config.ts](../src/constants/config.ts)

### 2. Header, Navigation & Global Layout
- **Navbar Component**: [Navbar.tsx](../src/components/layout/Navbar/Navbar.tsx)
- **Navbar Styling**: [Navbar.module.css](../src/components/layout/Navbar/Navbar.module.css)
- **Footer Component**: [Footer.tsx](../src/components/layout/Footer/Footer.tsx)
- **Footer Styling**: [Footer.module.css](../src/components/layout/Footer/Footer.module.css)
- **App Shell & Hero**: [App.tsx](../src/App.tsx), [App.module.css](../src/App.module.css)

### Landing and account pages

- The [landing hero](../src/features/landing/components/LandingHero.tsx) drives the [WebGL burger scene](../src/features/landing/services/burgerScene.ts) through native scroll. Desktop uses a pinned sequence, mobile uses a shorter track, and reduced motion or unavailable WebGL shows the still image.
- The featured carousel follows the hero. The [kitchen edit](../src/features/landing/components/KitchenPicks.tsx), full menu, and [FAQ](../src/features/landing/components/LandingQuestions.tsx) follow the carousel.
- The [account page](../src/features/auth/components/LoginPage.tsx) uses [Supabase email links](../src/features/auth/services/authService.ts). Guests and signed-in accounts use separate local cart and preview keys.
- Visual references inspected include the previous Soul Bites hero, Impossible Foods for oversized display type and floating cutouts, and Graza for cream editorial sections. [Soul Bites](https://soul-bites.vercel.app/) · [Impossible Foods](https://styles.refero.design/style/04961c7d-8ca6-4e87-ba88-6ad7ffa3b245) · [Graza](https://styles.refero.design/style/f2a84e0f-cf77-41fa-ade0-b062a3a42495)
- The new food images are illustrative ImageGen renders optimized to WebP. Barlow Condensed, Fraunces, Caveat, and Plus Jakarta Sans are self-hosted with [their licenses](../public/fonts/).

### 3. Menu Browsing, Filtering & Dish Details
- **Hero Bestsellers Infinite Window**: [HeroBestsellersInfinite.tsx](../src/features/menu/components/HeroBestsellersInfinite.tsx)
- **Hero Bestsellers Styling**: [HeroBestsellersInfinite.module.css](../src/features/menu/components/HeroBestsellersInfinite.module.css)
- **Bestsellers Carousel**: [BestsellersCarousel.tsx](../src/features/menu/components/BestsellersCarousel.tsx)
- **Carousel Styling & Pop Animations**: [BestsellersCarousel.module.css](../src/features/menu/components/BestsellersCarousel.module.css)
- **Menu Items Card**: [MenuItemCard.tsx](../src/features/menu/components/MenuItemCard.tsx)
- **Card Styling**: [MenuItemCard.module.css](../src/features/menu/components/MenuItemCard.module.css)
- **Category & Search Filter**: [MenuCategoryFilter.tsx](../src/features/menu/components/MenuCategoryFilter.tsx)
- **Filter Styling**: [MenuCategoryFilter.module.css](../src/features/menu/components/MenuCategoryFilter.module.css)
- **Menu Data Service**: [menuService.ts](../src/features/menu/services/menuService.ts)
- **Menu Type Contracts**: [menuTypes.ts](../src/features/menu/types/menuTypes.ts)

### 4. Shopping Cart & Price Calculation
- **Cart Slide-out Drawer**: [CartDrawer.tsx](../src/features/cart/components/CartDrawer.tsx)
- **Drawer Styling**: [CartDrawer.module.css](../src/features/cart/components/CartDrawer.module.css)
- **Cart State & Calculations**: [CartContext.tsx](../src/features/cart/context/CartContext.tsx)
- **Cart Type Contracts**: [cartTypes.ts](../src/features/cart/types/cartTypes.ts)

### 5. Checkout & Delivery Address Form
- **Checkout Dialog**: [CheckoutModal.tsx](../src/features/checkout/components/CheckoutModal.tsx)
- **Checkout Styling**: [CheckoutModal.module.css](../src/features/checkout/components/CheckoutModal.module.css)
- **Form Validation**: [checkoutValidation.ts](../src/features/checkout/validation/checkoutValidation.ts)
- **Checkout Type Contracts**: [checkoutTypes.ts](../src/features/checkout/types/checkoutTypes.ts)

### 6. Order Tracking & Kitchen Simulation
- **Order Tracker Component**: [OrderTracker.tsx](../src/features/tracking/components/OrderTracker.tsx)
- **Tracker Styling**: [OrderTracker.module.css](../src/features/tracking/components/OrderTracker.module.css)
- **Tracking Type Contracts**: [trackingTypes.ts](../src/features/tracking/types/trackingTypes.ts)

### 7. Reusable UI Primitives
- **Button Primitives**: [Button.tsx](../src/components/ui/Button/Button.tsx), [Button.module.css](../src/components/ui/Button/Button.module.css)
- **Dietary Badges**: [Badge.tsx](../src/components/ui/Badge/Badge.tsx), [Badge.module.css](../src/components/ui/Badge/Badge.module.css)
- **Accessible Modal**: [Modal.tsx](../src/components/ui/Modal/Modal.tsx), [Modal.module.css](../src/components/ui/Modal/Modal.module.css)
- **Brand SVG Icons**: [ShoppingCartIcon.tsx](../src/components/ui/Icons/ShoppingCartIcon.tsx)

### 8. Shared Helpers & Core Models
- **Formatters (Currency, ETA)**: [formatters.ts](../src/utils/formatters.ts)
- **Local Storage Helper**: [storage.ts](../src/utils/storage.ts)
- **Global Type Definitions**: [index.ts](../src/types/index.ts)

---

## 2. Common Agent Modification Tasks & Target Files

- **"Change the delivery fee or threshold"**: Edit [config.ts](../src/constants/config.ts)
- **"Add a new food category or menu item"**: Edit [menuService.ts](../src/features/menu/services/menuService.ts) and [menuTypes.ts](../src/features/menu/types/menuTypes.ts)
- **"Adjust the color palette or button styling"**: Edit [tokens.css](../src/styles/tokens.css) and [Button.module.css](../src/components/ui/Button/Button.module.css)
- **"Change checkout validation rules"**: Edit [checkoutValidation.ts](../src/features/checkout/validation/checkoutValidation.ts)
- **"Add a new step to order tracking"**: Edit [trackingTypes.ts](../src/features/tracking/types/trackingTypes.ts) and [OrderTracker.tsx](../src/features/tracking/components/OrderTracker.tsx)


## Frontend remediation — 5 November 2026

- Cart storage validation, migration and integer-money pricing: `src/features/cart/services/cartService.ts`.
- Cart context value: `src/features/cart/context/cartState.ts`; consumer hook: `src/features/cart/hooks/useCart.ts`.
- Local preview creation, cancellation, recovery and deletion: `src/features/checkout/services/checkoutService.ts`.
- Both cart and review use the shared native dialog in `src/components/ui/Modal/Modal.tsx`.
- `OrderTracker.tsx` currently displays the latest local preview; live fulfillment is not implemented.
- Unit tests live beside services and validation. Browser regressions: `tests/ordering.spec.ts`.
- Setup and verification commands: `README.md`; current remediation status: `docs/FIXES.md`.
