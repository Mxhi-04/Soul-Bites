# Frontend repairs — 5 November 2026

This first repair batch addresses the baseline [audit](AUDIT.md). It preserves the React 18 feature structure, CSS Modules, existing food imagery, and charcoal/yellow/cream brand.

## Implemented

| Area | Result |
| --- | --- |
| Cart corruption and price changes | Versioned ID/quantity storage, legacy migration, runtime validation, catalog price lookup, positive integer quantities capped at 99, and minor-unit pricing. Invalid JSON and invalid shapes recover safely. |
| Cross-tab cart updates | Storage events update the interface without writing stale data back. Web Locks serialize cart mutations where supported. Saving a preview subtracts its quantities from the current cart and preserves later additions. |
| Checkout minimum and validation | ₹149 minimum applies to food subtotal before fees, enforced in the cart and preview service. Indian mobile numbers and six-digit PINs are validated. Name/address/instruction lengths are bounded. |
| Submission cancellation | Abortable preview creation and duplicate-submit guards. Back, Escape, and dismissal cancel pending previews without clearing the cart. |
| Preview recovery | Complete product lines, totals, name, phone, address, apartment, PIN, notes, unique preview ID and ISO timestamp are saved in session storage. Refresh restores the latest preview; Clear preview removes it. |
| Honest transaction state | No unsupported payment options, Pay button, confirmed-kitchen messages, customer-controlled fulfillment stages or invented ETA. Demo status is visible, and saving explicitly creates a local preview. |
| Dialog accessibility | Shared native modal dialog with a named heading, initial focus, background inertness, focus wrapping, Escape dismissal, scroll locking and focus restoration. Both cart and review use it. |
| Form accessibility | Associated labels, autocomplete, required fields, invalid states, described errors and first-error focus. Apartment and delivery instructions now have inputs. |
| Hero interaction | Enter/Space on Add to cart adds the dish without rotating. A separate rotation control supports pause/resume, focus pauses rotation, reduced motion disables automatic rotation, and navigation dots have larger hit areas and selected states. |
| Unsupported content | Removed promotional percentage claims and fabricated rating displays. Standardized the pizza name to Paneer Tikka. Removed unverified kitchen/contact claims from the footer and displayed the illustrative nature of the menu. |
| Menu usefulness | Dietary filter, vegetarian results including vegan items, textual dietary badges, expandable dish details, spice information and preparation estimates. Search/category selections have accessible labels and states. |
| Resilience | Error boundary, menu error handling, race-safe menu responses and correctly timed live-region cart notifications. |
| Performance | Replaced the approximately 681 KB displayed logo with a 47 KB variant, removed the duplicate font stylesheet, removed duplicated fallback catalog/image requests, and preloaded the initial pizza image. |
| Discovery and hosting | One page h1, correct heading hierarchy, valid robots.txt, usable menu links, and declared Vercel CSP/frame/referrer/MIME-sniffing headers. Live-domain canonical, sitemap and business metadata remain pending. |
| Tooling | Vite 8.3.6 and matching React plugin, current test tooling, and a scoped minimatch override for the TypeScript ESLint parser. Full npm audit reports zero advisories at verification time. |
| Verification and maintenance | Unit and desktop/mobile browser regressions, CI workflow, updated setup README, portable project-map links and this repair log. |

The original audit remains a historical baseline, not a statement that these repaired defects are still present.

## Validation

- `npm run check`: ESLint without warnings, 25 passing unit tests, successful production build.
- All 20 desktop/mobile Chrome browser checks passed. They cover cart corruption and price changes, minimum subtotal, Enter/Space purchasing, dialog focus and Escape, validation, cancellation, preview persistence/clearing, cross-tab updates, dietary filtering, reduced motion, and automated accessibility scans. [Run output](fix-evidence/browser-tests.txt).
- Additional repeated cross-tab checks exercise simultaneous additions and changes around preview completion.
- Real development-server smoke test: no page errors or React console warnings after correcting React 18's image-priority attribute forwarding.
- Visual review at 1440 × 1000 and 390 × 844: home, menu, cart, review and saved preview. [Evidence](fix-evidence/visual-checks.json), [mobile home](fix-evidence/mobile-home.png), [mobile review](fix-evidence/mobile-review.png), [desktop preview](fix-evidence/desktop-preview.png).
- [Dependency audit](fix-evidence/npm-audit.json).

### Mobile Lighthouse comparison

Same Lighthouse 13.6.0 simulated mobile profile against the local production build:

| Measurement | Baseline | After repairs |
| --- | --- | --- |
| Performance | 74 | 87 |
| Accessibility | 92 | 100 |
| Best Practices | 100 | 100 |
| SEO | 92 | 100 |
| Largest Contentful Paint | 10.1 s | 4.1 s |
| Total transfer | 1,654 KiB | 997 KiB |

[Full report](fix-evidence/lighthouse-mobile.html) · [Machine-readable summary](fix-evidence/lighthouse-summary.json).

These are laboratory navigation scores, not production measurements or proof of complete accessibility/security. LCP still needs improvement; remaining opportunities include food-image compression and render-blocking font requests. No live-domain SEO or hosting behavior is certified by the local score.

## Skill guidance

The requested [benjitaylor/skills Stageshow skill](https://github.com/benjitaylor/skills/tree/main/stageshow) was already installed. Its applicable craft, motion and verification guidance informed clear action labels, purposeful motion, reduced-motion behavior, readable controls and desktop/390px visual review. These artifacts capture the working app. No faux product scene, kit copy or scripted illustration was added.

## Still required before real orders

- A database-backed catalog/order API and server-authoritative pricing. Browser catalog validation is useful hardening, not a security boundary for real payments.
- Verified payment/COD records, provider webhooks, idempotency, failed-payment recovery, refunds and reconciliation.
- Staff authorization, kitchen acceptance/rejection, inventory, delivery zones, opening hours/capacity, dispatch and actual tracking.
- Durable customer order lookup and notifications. Session previews are local to the browser tab, support only the latest preview, and are not real order history. Browser session restoration can retain session storage.
- Verified ingredients/allergens, actual dish photography, service area, business/contact/certification information and customer policy pages.
- Production monitoring, backup/restore procedures, production-domain header/CSP validation and real-device/real-user performance checks.

This batch does not create or deploy a production backend, process payments, publish the site, or invent missing business details. The native dialog and Web Locks behavior was tested in Chrome; Safari/Firefox and assistive-technology testing remain worthwhile before launch. Without Web Locks, cross-tab mutations use a best-effort fallback and are not atomic across tabs.
