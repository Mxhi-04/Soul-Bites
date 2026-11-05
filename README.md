# Soul Bites

A responsive React 18, TypeScript and Vite food-menu and order-preview app with CSS Modules.

**Ordering and payments are not live.** The app lets visitors explore the sample menu, build a cart, review sample delivery details, and save a local preview. It does not send an order to a kitchen or charge a customer.

## Run locally

Requires Node.js 22.12 or newer (Node.js 24 is used in CI).

```sh
npm ci
npm run dev
```

The development server opens on port 3000. For a production build:

```sh
npm run build
npm run preview
```

## Checks

```sh
npm run check                 # lint, 25 unit tests, production build
npx playwright install chromium
npm run test:e2e              # production build and desktop/mobile browser tests
npm audit
```

Browser checks cover keyboard ordering, accessible dialogs, validation, minimum orders, cart corruption, forged prices, cancellation, preview recovery, cross-tab updates, and automated accessibility scans.

To use a locally installed Chrome executable instead of Playwright's Chromium, set `PLAYWRIGHT_CHROME_PATH` to its absolute path. CI installs Chromium itself.

## Data and behavior

- The catalog is defined in `src/features/menu/services/menuService.ts`.
- The cart stores versioned product IDs and bounded integer quantities in local storage. Prices and descriptions are resolved from the current bundled catalog. Legacy carts are migrated; invalid entries are discarded. Open tabs synchronize storage changes.
- Display totals use integer minor units for arithmetic. The minimum food subtotal is ₹149, delivery is ₹35 below ₹499, and estimated tax is 5%, configured in `src/constants/config.ts`. These are preview rules, not verified production tax or fulfillment rules.
- Delivery validation currently targets Indian mobile numbers and six-digit PIN codes, consistent with INR pricing. It does not verify delivery serviceability.
- Only the latest preview is saved, in session storage for the current tab. It includes sample delivery details and survives a refresh. Clear it with **Clear preview**; closing the tab ends its normal session. Browser session-restoration behavior may retain session storage.
- Cancelling an in-progress preview leaves the cart intact. Saving subtracts the previewed quantities, preserving later additions.
- No environment variables, API credentials, payment secrets, or backend services are required for the current preview.

## Architecture

Features own their services, validation, types and components. Shared UI has no domain logic. Cart state lives in its provider; page state stays in the app shell. All new styling uses the existing charcoal, yellow and cream tokens.

See [AGENTS.md](AGENTS.md), [project map](docs/PROJECT_MAP.md), [baseline audit](docs/AUDIT.md), and [repairs and remaining work](docs/FIXES.md).

## Before a real launch

Implement server-authoritative prices, persistent orders, verified payments/COD records, staff authorization, kitchen acceptance, delivery-zone and stock checks, notifications, cancellation/refunds, verified business/food information, policy pages, and monitoring/backups. Client-side cart validation and a saved local preview are not substitutes for these systems.

The Vercel configuration serves the static SPA and declares a restrictive security-header policy for the current asset origins. Review the CSP and routing when integrating APIs, payment providers, or other third-party resources. Production headers and deployment behavior must be verified on the actual domain.

A scoped minimatch override updates the TypeScript ESLint parser's affected dependency to 11.0.4 or newer. Remove the override when upstream supports a patched dependency directly. Vite 8 and the React plugin are updated together; build and browser checks validate this project's migration.
