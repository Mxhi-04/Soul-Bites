# Soul Bites — product and engineering audit

> This is the baseline audit of commit `00a0e44`. For subsequent repairs and outstanding launch blockers, see [FIXES.md](FIXES.md).

Audited on 5 November 2026. Repository: https://github.com/Mxhi-04/Soul-Bites.git

Commit: `00a0e44a8980a588aabbc03ec0ad9502c1b120e4`.

## Verdict

**This is a food-ordering frontend prototype. It is not ready to accept real customer orders or payments.** The visual system and feature organization provide a useful foundation, but the order-to-kitchen-to-delivery system is absent. The highest priority is completing the transaction and operational workflows, followed by fixing the reproducible frontend defects.

This audit distinguishes defects in existing behavior, absent capabilities needed for a real ordering business, and optional enhancements. Missing authentication alone is not a defect: guest checkout is appropriate if orders and payment sessions are protected properly.

## Scope and evidence

- Cloned the repository into `/Users/jatin/Projects/SoulBites` and reviewed its source, configuration, asset sizes, dependency lockfile, architecture instructions, and documentation.
- Installed the locked application dependencies with `npm ci --ignore-scripts`; application dependency installation scripts were not executed.
- Ran the TypeScript/production build and ESLint.
- Tested the production build locally using Vite preview and headless Google Chrome through Playwright. No real orders, customer data, or payment transactions were involved.
- Inspected layouts at widths 320, 375, 390, 768, and 1440 pixels. Tested search, category filtering, cart quantities, checkout validation, refresh recovery, keyboard interactions, corrupted storage, local price changes, cancellation during submission, and multiple tabs.
- Ran axe checks on the home page, cart, and checkout, allowing opening animations to settle before the final scans.
- Ran one mobile Lighthouse navigation audit against the local production build. These are simulated laboratory measurements, not production traffic measurements or a complete accessibility certification.
- Ran npm's advisory audit for the complete dependency tree and separately for production dependencies.

No production deployment URL was supplied. Hosting headers, CDN behavior, uptime, real users' performance, and any separate unpublished backend were not verified. The conclusions about absent systems apply to the audited repository.

Artifacts:

- [Runtime checks and axe details](audit-evidence/runtime-results.json)
- [Additional functional checks](audit-evidence/functional-results.json)
- [Additional mobile and promotion evidence](audit-evidence/followup-results.json)
- [Mobile Lighthouse report](audit-evidence/lighthouse-mobile.html) and [summary](audit-evidence/lighthouse-summary.json)
- [Complete dependency audit](audit-evidence/npm-audit.json) and [production dependency audit](audit-evidence/npm-audit-production.json)
- [Desktop screenshot](audit-evidence/desktop-home.png), [mobile screenshot](audit-evidence/mobile-home.png), [desktop checkout](audit-evidence/desktop-checkout.png), [mobile checkout](audit-evidence/mobile-checkout.png)

## What already works

The app has a consistent charcoal/yellow brand, responsive menu grid, feature-based React/TypeScript organization, reusable UI primitives, search, category filters, a cart drawer, and a checkout form with basic required-field validation. Ordinary cart persistence across refresh works for valid stored data.

Browser checks found nine menu items, three items in the burger category, one pizza search result, and the expected empty-result message for an unmatched query. Quantity changes updated totals correctly in tested examples; five ₹119 drinks produced a ₹595 subtotal, free delivery, ₹29.75 estimated tax, and ₹624.75 total. No document-level horizontal overflow appeared at the five tested widths. This does not establish that every carousel element or every device layout is correct.

`npm run build` passed. Output: approximately 181.16 kB JavaScript / 58.46 kB gzip and 40.03 kB CSS / 7.87 kB gzip. The JavaScript bundle is relatively small; images and loading order are more urgent performance concerns than adding code splitting at this scale.

`npm run lint` finished with zero errors and two warnings: mixed component/hook exports in `CartContext.tsx:93`, and a missing effect dependency in `BestsellersCarousel.tsx:51`. The latter carousel is not imported by the current app shell, so that warning should not be presented as a confirmed active-page malfunction.

## Priority definitions

- **Launch blocker:** a necessary transaction or operational capability is absent; real ordering should not be enabled until it exists.
- **High:** an existing flow fails, loses order information, misrepresents pricing, or creates a material trust boundary problem.
- **Medium:** usability, accessibility, resilience, maintainability, or discoverability needs attention.
- **Low:** cleanup or incremental improvement.

## Launch blockers

### B1. Orders never reach a server or kitchen

**Evidence:** `src/features/checkout/components/CheckoutModal.tsx:46–67`; `src/features/menu/services/menuService.ts:136–159`.

Submitting checkout starts a 600 ms timeout, generates a random six-digit ID, and invokes a callback. Browser network inspection recorded **zero requests after Pay**. There is no order API, database, kitchen notification, staff acceptance, or dispatch integration in this repository. Menu data comes from a hardcoded array.

**Impact:** a customer sees “Order Confirmed,” but no kitchen has received an order.

**Needed:** a server-side order service and durable order records, authenticated staff access, acceptance/rejection, inventory validation, and customer confirmation tied to the persisted record. Generate unique IDs on the server and use an idempotency key so retries cannot create duplicate orders.

### B2. Payment choices have no payment implementation

**Evidence:** `CheckoutModal.tsx:24–33, 46–67, 157–195`; `src/features/checkout/types/checkoutTypes.ts:1–31`.

Card, Apple Pay, and Cash only change component state. There is no payment session, provider SDK, provider request, payment authorization, webhook verification, or recorded payment status. The selected payment method is not included in `PlacedOrder`.

**Impact:** clicking “Pay” confirms an order without collecting or verifying payment. Cash orders also have no operational record.

**Needed:** provider-hosted payment collection, server-created payment sessions, verified callbacks/webhooks, separate payment and fulfillment states, failure/retry/refund handling, and a persisted COD choice. If India is the intended market, evaluate UPI support alongside cards and COD. Never treat a browser callback alone as proof of payment.

### B3. Tracking is a customer-controlled simulation

**Evidence:** `src/App.tsx:61–75`; `src/features/tracking/components/OrderTracker.tsx:91–95`.

The visible “Simulate Next Kitchen Stage” button lets the shopper advance from received to delivered. Three clicks marked the test order delivered. ETA begins at a fixed 28 minutes and changes only when a stage is advanced; it does not reflect elapsed time or rider progress.

**Needed:** server-owned transitions, authorization for kitchen/dispatch roles, persisted event history, customer polling or push updates, and honest ETA estimates. Keep simulation controls in an explicitly identified demo environment.

### B4. Serviceability, opening hours, and stock are not enforced

**Evidence:** `src/constants/config.ts:8–19`; `src/components/layout/Navbar/Navbar.tsx:40–43`; `checkoutValidation.ts:18–27`.

“Kitchen Active • 20–35 min delivery” is hardcoded. `isOpenNow: true` is not a computed availability rule. The app accepts any city and any postal string of four characters; there is no delivery-zone lookup, kitchen capacity check, unavailable-item state, or scheduling policy.

**Needed:** check location before checkout, compute operating status in the kitchen's timezone, block unavailable items and closed-kitchen orders, and revalidate serviceability and pricing on the server.

## Confirmed high-priority defects

### H1. Refresh loses the order while retaining the ordered cart

**Evidence:** `src/App.tsx:33–35, 49–58`; `CartContext.tsx:12–19, 51–53`.

After checkout, the cart still held the purchased item. Refresh removed the Track Order button and all active tracking state, but the cart remained populated. `clearCart()` exists but is never invoked by the checkout success path. A second order also replaces the only `activeOrder` state.

**Impact:** customers cannot recover their order and can easily submit the same items again.

**Fix:** persist a complete server-side order and recover it via a protected order link or verified customer session. Clear the purchased cart only after confirmed order creation, preserving any items added after that order's snapshot. Support multiple active orders or a recoverable order history.

### H2. Editing local storage changes checkout prices, including negative totals

**Evidence:** `CartContext.tsx:12–13, 55–66`; `src/utils/storage.ts:6–10`.

The entire item object, including price, is restored from local storage and used as the pricing authority. Changing a ₹119 drink's stored price to `-100` produced subtotal ₹-100, tax ₹-5, and total **₹-70**. The simulated checkout accepted it.

**Impact:** totals have no integrity guarantee. This is a confirmed client-side trust flaw, not proof of theft from a real payment system: no payment system exists here.

**Fix:** store only product IDs, option IDs, and bounded positive integer quantities in the cart. Rehydrate against the current catalog. Calculate all billable prices, discounts, taxes, and delivery charges on the server; the client should display the server quote. Use minor currency units and an explicit rounding policy.

### H3. A valid JSON value of the wrong shape crashes the entire app

**Evidence:** `storage.ts:6–10`; `CartContext.tsx:12–13, 55–57`; `src/main.tsx:8–14`.

Reproduction: `localStorage.setItem('soul_bites_cart', '{}')`, then reload. The root rendered empty and Chrome reported `t.reduce is not a function`. The storage wrapper catches JSON parsing failures, but a TypeScript cast does not validate parsed JSON. There is no error boundary to provide recovery.

**Fix:** validate cart shape and field bounds at runtime, reject unknown product IDs, migrate versioned cart data, discard invalid entries safely, and add a recoverable error UI.

### H4. Cancelling a pending checkout still creates an order

**Evidence:** `CheckoutModal.tsx:54–67, 198–199`.

Reproduction: submit valid details and click Back during the 600 ms submission delay. The checkout closes, then “Order Confirmed” appears anyway. The pending callback is never cancelled or reconciled with the closed state.

**Fix:** define submission and cancellation states explicitly. Prevent ambiguous dismissals while committing a real order, or provide a cancellable pre-commit phase. Once a real payment/order may have committed, resolve its server state and show the result instead of claiming it was cancelled. Use idempotency for retry safety.

### H5. Enter on the hero Order Now button does not add the item

**Evidence:** `src/features/menu/components/HeroBestsellersInfinite.tsx:438–447, 475–484`.

Reproduction: focus the pizza's Order Now button and press Enter. The active card switched to the burger and the cart stayed empty. Keydown bubbles to the parent card, which rotates and removes the center button before normal activation completes. Stopping propagation only on click is insufficient.

**Fix:** keep card navigation and purchasing controls independent. Ignore descendant key events in the card handler, preserve native button behavior, and verify Enter and Space through the completed purchase flow.

### H6. “15% OFF” has no corresponding pricing rule or explanation

**Evidence:** `HeroBestsellersInfinite.tsx:15–20, 475–487`; `CartContext.tsx:64–66`.

The pizza advertises “15% OFF” at ₹269. Adding it charges ₹269; there is no original price, promotion eligibility rule, savings line, or expiry explanation. `discount` is always zero. This could theoretically be intended as an already-discounted price, but the current data model contains no evidence or explanation of that interpretation.

**Fix:** implement and display a consistent promotion model with original price, final price, eligibility, and server validation, or remove the unsupported offer.

## Medium-priority issues

| ID | Finding and evidence | Impact / recommended action |
| --- | --- | --- |
| M1 | Minimum order is configured as ₹149 but unused (`config.ts:16`). A ₹119 drink reached checkout and was accepted at ₹159.95 including delivery and tax. | Decide whether the minimum applies to subtotal; enforce the intended rule consistently on the server and explain it in the cart. Current code enforces neither interpretation. |
| M2 | Phone validation only requires at least ten extracted digits; postal validation only requires four characters (`checkoutValidation.ts:13–27`). `abc123456789012345678901234` and `abcd` passed. | Validate bounded, market-appropriate formats; normalize phone input; check actual deliverability separately. Avoid overly restrictive name validation. |
| M3 | Both dialog containers have `role="dialog"` without an accessible name (`Modal.tsx:29`, `CartDrawer.tsx:18`). Opening the cart left focus on the background header. Tabbing past checkout's last button escaped the dialog. | Add title associations, initial focus, a focus trap, inert background content, and focus restoration. Prefer one shared accessible dialog primitive. |
| M4 | Cart Escape does not close the drawer, and the cart does not lock body scrolling. Checkout does implement Escape and a body scroll lock. | Bring cart and checkout behavior into the same dialog implementation; verify keyboard and touch behavior. |
| M5 | Checkout labels are not linked using `htmlFor`/`id`; errors lack `aria-invalid` and `aria-describedby` (`CheckoutModal.tsx:75–152`). There are no explicit autocomplete tokens. Payment cards have no radio/pressed selection semantics. | Associate labels and errors, announce the first invalid field, add appropriate autocomplete, and model payment choices as an accessible radio group. Placeholder-derived accessible names do not substitute for the intended visible label association. |
| M6 | Footer text fails contrast: axe measured 3.11:1 where 4.5:1 is expected. Lighthouse also flagged the hero CTA's visible label/accessibility-name mismatch and 12 × 12 px carousel dots with inadequate spacing. | Improve muted text tokens, make the accessible button name include the visible action, and enlarge hit areas. A high automated accessibility score does not cover keyboard purchasing failures. |
| M7 | Carousel rotates automatically, pauses only on mouse hover, has no persistent pause/resume control, and has no reduced-motion handling. Carousel state and filter/payment selection are not adequately exposed to assistive technology. | Pause on focus, offer a persistent control, respect reduced-motion preferences, expose selected states, and announce changes without excessive speech. |
| M8 | Dietary metadata exists but the active menu card renders only explicit `veg` badges (`MenuItemCard.tsx:21`). Vegan, non-vegetarian, gluten-free, spice level, and preparation-time data are not surfaced. No dietary filter is wired into `App.tsx`. | Display consistent, textual dietary information. Add verified ingredient/allergen and cross-contact information before relying on dietary claims. |
| M9 | Ratings are hardcoded; absent ratings default to 4.8. Every card renders exactly three full stars despite numeric ratings such as 4.9 (`MenuItemCard.tsx:12, 43–46`). | Use verified review data and counts, or label/remove sample ratings. Make numeric and visual ratings agree. |
| M10 | Visible content is inconsistent: hero says “Paneer Makhana” while the catalog says “Paneer Tikka.” Several stock photos do not visually match their advertised dishes: the mango drink appears as a clear citrus drink and the chicken burger shows a patty-style burger. | Use actual dish photography and a single source for names and ingredients. Images alone do not establish the real ingredients; verify the catalog with the kitchen. |
| M11 | INR pricing and FSSAI wording coexist with a US-style +1 555 contact number and US address/ZIP examples (`config.ts:20–27`, checkout placeholders). No street address or supported delivery locality is shown. | Confirm the market and replace sample business details, placeholders, hours, and service area with verified information. |
| M12 | Checkout collects a name, phone, and postal code but `PlacedOrder` contains only item count, total, a partial address, ETA, time, and ID (`checkoutTypes.ts:24–31`, `CheckoutModal.tsx:56–63`). Product lines, customer contact, postal code, payment choice, and apartment details are absent from the order record. | Define a complete order contract, including immutable line-item/price snapshots, address/contact fields, timestamps, fees, payment status, and fulfillment status. Apartment and delivery-note fields exist in the type/state but have no form inputs. |
| M13 | Two tabs do not synchronize cart state. With five drinks in both tabs, adding one in tab one left tab two showing five. | Handle storage updates or use a shared authoritative cart; avoid stale tabs overwriting newer changes. |
| M14 | Menu requests have no loading, failure, or retry UI, and the app has no error boundary (`App.tsx:28–41, 129`). | Introduce explicit async states when connecting APIs. Current in-memory promises do not fail under normal use, so API failure behavior remains an integration gap. |
| M15 | Added-to-cart toasts have no live region; repeated additions start independent timers (`App.tsx:43–46, 171`). | Announce concise status changes and clear/replace the previous timeout so older timers cannot dismiss newer messages prematurely. |

Dialog and carousel expectations are supported by the [W3C modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [W3C carousel guidance](https://www.w3.org/WAI/tutorials/carousels/). Automated scans are supplemented here by keyboard reproductions.

## Performance findings

One Lighthouse 13.6.0 mobile run against `http://127.0.0.1:4173/` produced:

| Measurement | Result |
| --- | --- |
| Performance | 74 / 100 |
| Accessibility | 92 / 100 |
| Best Practices | 100 / 100 |
| SEO | 92 / 100 |
| First Contentful Paint | 1.5 s |
| Largest Contentful Paint | 10.1 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 3.2 s |
| Total transfer | 1,654 KiB |

These scores describe the audited navigation only. In particular, 100 in Best Practices does not mean the app has secure or complete transaction processing, and 92 in Accessibility does not mean checkout is accessible.

1. **Oversized logo:** the logo transferred about 681,106 bytes while Lighthouse measured its mobile header display at approximately 58 × 42 pixels. Source width is 1,014 pixels. Produce a small appropriately scaled optimized logo with explicit dimensions; this is a larger download than the JavaScript bundle.
2. **Image delivery:** Lighthouse estimated roughly 914 KiB of image savings. The pizza image transferred about 224,568 bytes; the decorative pattern about 138,811 bytes. Use optimized AVIF/WebP where suitable and responsive image variants. Separate hero and card sizes.
3. **Late hero discovery:** the LCP pizza image is only discovered after JavaScript renders, with no high-priority hint. Consider preloading the stable initial hero asset and setting `fetchPriority="high"`; verify the benefit rather than preloading every carousel image.
4. **Duplicate font CSS:** fonts are loaded in both `index.html:12` and `globals.css:2`. Lighthouse reported render-blocking requests with approximately 830 ms potential savings. Consolidate the font strategy and reduce unnecessary weights and external dependencies.
5. **Transient duplicate carousel downloads:** initial fallback bestseller items request 800 px Unsplash variants before the loaded catalog switches to 600 px variants. Browser logs recorded aborted fallback requests. Do not label these as broken permanent images; remove the duplicated source data and use a stable initial dataset.
6. **Rendering cost:** large blur, glow, shadows, 3D transforms, and persistent `will-change` deserve profiling on low-end phones. This is an unmeasured risk; the run measured zero blocking time and zero layout shift, so claims of confirmed animation jank would be unsupported.

Re-run the same mobile profile after optimization, then collect production real-user performance. Local hosting latency and external image/font behavior may differ from production.

## Security and dependency assessment

The full `npm audit` scan reported **9 affected dependency entries: 1 high and 8 moderate**. These are dependency-tree entries, including transitive propagation, not nine independently demonstrated attacks. Vite resolved to 5.4.21. Reported chains include Vite/esbuild and minimatch through the TypeScript ESLint tooling.

`npm audit --omit=dev` reported **zero production dependency advisories**. The findings are in development/build tooling. Several reported Vite issues depend on Windows, specific editors, server configuration, or exposing a development service. They do not establish an exploit against the deployed static website. The exact advisory feed responses are preserved in the JSON artifacts; npm's classifications are not a substitute for reproducing applicability.

An independently reviewed [esbuild maintainer advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99) describes cross-origin access to its development server in affected versions. Review the actual tooling paths used by the project before assigning exposure.

Update Vite and associated tooling through a reviewed compatibility upgrade, refresh affected transitive dependencies, and re-run build/lint/audit. Do not blindly apply `npm audit fix --force`: npm proposed a major Vite upgrade.

No server implementation, authentication layer, payment secret handling, or admin authorization was available to audit. It would be inaccurate to certify these as secure or vulnerable. No `dangerouslySetInnerHTML` use was found in the reviewed components; React renders the observed user strings as text. No tracked environment credential file was present in the repository file inventory; this was not a historical secret-forensics audit.

`vercel.json` contains a build configuration and catch-all rewrite, but no explicit security-header policy. Verify deployed responses before concluding headers are absent: infrastructure may supply them. For launch, configure suitable CSP, frame restrictions, referrer policy, and MIME-sniffing protection, and review third-party asset origins. Add authorization, server-side validation, rate limiting, webhook signature checks, and operational logs when the backend exists.

## Search discovery and business trust

- A title, description, language, favicon, and viewport are present.
- There is no page `<h1>`, canonical URL, Open Graph/Twitter sharing metadata, structured restaurant/menu data, sitemap, or real robots file in the repository. Lighthouse requested `/robots.txt`, received the SPA fallback HTML, and reported 20 parse errors. Fix the actual file and route handling; the production behavior still needs verification.
- There are no real anchor links on the rendered home page. Contact phone/email are plain text. Use working `tel:` and `mailto:` links and useful navigation to menu, delivery information, support, and policies.
- No privacy, terms, cancellation/refund, delivery-policy, or support/help pages were found. These are customer-information and launch-readiness gaps; this audit does not determine jurisdiction-specific legal compliance.
- “5-Star FSSAI Certified,” sourcing, hygiene, and contactless-preparation claims are static text. No license details or substantiating record is supplied. Verify claims and display accurate business information; this audit did not validate or disprove certification.
- The menu is client-rendered. JavaScript-capable crawlers may index it, but product detail URLs and server/prerendered discovery content are absent. Do not assume client rendering means search engines cannot index the site.

## Missing capabilities, ordered by business need

| Capability | Needed for a real-ordering launch | Current state |
| --- | --- | --- |
| Order API and database | Yes | No implementation found |
| Kitchen/admin dashboard and staff permissions | Yes, or a reliable equivalent fulfillment system | No implementation found |
| Product availability and authoritative prices | Yes | Hardcoded menu, browser-calculated totals |
| Payment/COD records and reconciliation | Yes | UI choices only |
| Delivery-zone and kitchen-open validation | Yes | No enforcement found |
| Durable confirmation and recoverable order lookup | Yes | Browser-memory tracker only |
| Customer contact, complete address, line-item record | Yes | Incomplete transient order model |
| Kitchen acceptance, dispatch, rejection, cancellation, refund | Yes | Only client simulation stages |
| Confirmation and status communication | Yes, through a suitable channel | No email/SMS/WhatsApp integration found |
| Real support details and policy pages | Yes | Placeholder-looking contact data, no policy pages |
| Allergen/ingredient/dietary information | Required product work before relying on food claims | Partial data, mostly hidden; no allergen model |
| Error monitoring, health checks, backups, restore plan | Yes for operational launch | No implementation/configuration found |
| Automated transaction tests and CI checks | Yes for dependable releases | No tests or CI workflow found |
| Analytics for menu → cart → checkout → payment funnel | Strongly recommended | No integration found |
| Coupon rules and truthful offer display | Required if offers remain advertised | Decorative offer tag only |
| Item detail view, sizes, add-ons, spice choices, notes | Depends on the actual kitchen menu | No detail/customization flow |
| Customer accounts, saved addresses, reorder | Optional; guest checkout can launch without accounts | Not implemented |
| Favorites, loyalty, referral rewards, bundles | Optional growth work | Not implemented |
| PWA installation, push notifications, multilingual UI | Optional; prioritize using customer demand | Not implemented |

## Architecture and maintainability

The feature structure is a strength and does not require a framework rewrite. Keep the existing domain boundaries while adding service interfaces and backend contracts.

- `CheckoutModal` currently mixes form rendering and transaction simulation. Move transaction orchestration into a checkout service/state machine when implementing real orders.
- Catalog data is duplicated in the service and hero fallback, with separate poster metadata and hardcoded five-item rotation assumptions. Use a single catalog and explicitly derived promotion/presentation metadata.
- Cart data needs a versioned runtime schema; compile-time interfaces cannot protect storage or API boundaries.
- Centralized business constants are a good start but some are unused while status strings and ETA values are separately hardcoded. Establish one source for operational rules.
- Old hero CSS, the unused alternate bestseller carousel, React/Vite template assets, and multiple logo variants increase maintenance and asset clutter. Clean them up after confirming imports and preserving originals outside public deployment assets where appropriate.
- README is still the Vite starter README. Project-map links point to another developer's absolute `file:///Users/mahipatni/...` paths. Replace them with portable repository links and document setup, environment variables, architecture, order lifecycle, deployment, and recovery.
- No test command, test suite, or CI workflow was found. Add meaningful coverage around money, order idempotency, validation, corruption recovery, payment verification, checkout cancellation, and keyboard purchasing. Keep lint/build and dependency checks in CI.

## Recommended implementation sequence

1. **Make the current scope honest:** label the deployment as a demo until real ordering is ready; remove unsupported payment, discount, and live-delivery claims or wire them to real behavior. Replace sample business information.
2. **Repair frontend correctness:** cart schema validation and recovery; accessible shared dialogs; hero keyboard action; truthful promotions; minimum-order enforcement; valid contact/address inputs; safe submission state; cart clearing after confirmed success.
3. **Build the transaction foundation:** database-backed catalog/orders, server quote calculation, immutable line items, customer contact/address, idempotency, order retrieval, and staff authorization. Reconcile cart prices against the current catalog.
4. **Connect payment and operations:** verified payment lifecycle, COD records, kitchen acceptance/rejection, availability and delivery zones, dispatch updates, cancellation/refunds, customer notifications, and support access.
5. **Improve acquisition and speed:** compress the logo and imagery, stabilize hero resources, consolidate fonts, repair robots/sitemap and metadata, add useful product/business pages, verified dietary content, and genuine reviews if available.
6. **Harden releases and operations:** tests/CI, compatible dependency updates, deployed-header checks, monitoring, alerting, backups, restore verification, and real-device/production performance validation.

Do not begin optional loyalty or account features before reliable order acceptance and fulfillment exist.

## Acceptance checks before launch

- A paid order has a durable server record, verified payment state, correct line items/fees/address, and a kitchen acknowledgment.
- Editing local storage cannot alter a server quote or payment amount; corrupt storage recovers without a blank page.
- Retry, refresh, back navigation, duplicate submission, payment failure, and network loss cannot create silent duplicates or lose the customer's confirmed order.
- Closed kitchens, unavailable dishes, unsupported addresses, and below-minimum carts receive correct explanations and are rejected where intended.
- Customers cannot mutate fulfillment status; staff actions are authorized and logged.
- Checkout works with keyboard and assistive technology, retains focus correctly, and exposes labels/errors/selected states.
- Customer support, cancellation/refund handling, policies, business details, and food claims are verified and usable.
- The optimized build is checked on real target phones and the production domain, with monitoring and recovery procedures in place.

Only audit documentation and evidence were added during this review. Application source and dependency versions were not changed.
