<div align="center">

<img src="public/images/soul_bites_logo_small.webp" width="144" alt="Soul Bites logo with the burger-loving ghost mascot">

# Soul Bites

**Big bites. Big soul.**

A cloud-kitchen storefront preview. Build a burger with a scroll, find your next bite, and try the menu-to-cart experience.

[![Checks](https://github.com/Mxhi-04/Soul-Bites/actions/workflows/ci.yml/badge.svg)](https://github.com/Mxhi-04/Soul-Bites/actions/workflows/ci.yml)
![React 18](https://img.shields.io/badge/React-18-262626?logo=react&logoColor=F5B700)
![TypeScript](https://img.shields.io/badge/TypeScript-262626?logo=typescript&logoColor=F5B700)
![Vite](https://img.shields.io/badge/Vite-262626?logo=vite&logoColor=F5B700)
[![MIT License](https://img.shields.io/badge/License-MIT-262626)](LICENSE)

[Try Soul Bites](https://soul-bites.vercel.app/) · [Watch the demo](#watch-the-demo) · [Run locally](#quick-start) · [Project map](docs/PROJECT_MAP.md)

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="docs/showcase/home.webp">
  <img src="docs/showcase/meal-assembly.gif" width="100%" alt="Soul Bites scroll animation showing a smash burger assembling, fries filling their pouch, and a mojito pouring alongside">
</picture>

<sub>The landing scene follows your scroll. The burger stacks, the mojito fills, and the fries rise into the pouch.</sub>

</div>

## What you can try

- **Build the meal.** Scroll to assemble the WebGL burger alongside the mojito and fries, then continue into the featured dish carousel.
- **Find your bite.** Search the sample catalog by dish or ingredient and narrow it by category and dietary preference.
- **Try checkout as a guest.** Add a dish, review the INR totals, and save a sample order to the current browser tab.
- **Explore email sign-in.** A configured Supabase project enables one-time email links. This browser keeps guest and account carts separate.

> [!NOTE]
> Soul Bites is an interactive storefront preview. Checkout saves a sample locally without placing an order or collecting payment.

## Watch the demo

Follow the scroll animation, search for paneer, add a pizza, and save a sample order.

<a href="docs/showcase/soul-bites-demo.mp4"><img src="docs/showcase/demo-poster.webp" width="100%" alt="Watch the MP4 demo, from the Soul Bites landing scene to the cart and checkout preview"></a>

[Open the demo video (MP4)](docs/showcase/soul-bites-demo.mp4)

<details>
<summary><strong>See the guest checkout as a GIF</strong></summary>

<img src="docs/showcase/guest-checkout.gif" width="100%" alt="A guest searches for paneer pizza, opens the cart, enters sample delivery details, and saves an order preview">

</details>

## Screen gallery

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/showcase/menu.webp" width="100%" alt="Soul Bites menu with search, dietary filters, category chips, and dish cards">
      <p><strong>The full menu</strong><br>Search and filter the sample dishes.</p>
    </td>
    <td width="50%" valign="top">
      <img src="docs/showcase/sign-in.webp" width="100%" alt="Soul Bites sign-in page with the meal artwork and an email form">
      <p><strong>The account page</strong><br>Request a one-time link when Supabase is configured, or continue as a guest.</p>
    </td>
  </tr>
</table>

## Quick start

Use Node.js **22.12 or newer**. CI runs on Node.js 24.

```sh
git clone https://github.com/Mxhi-04/Soul-Bites.git
cd Soul-Bites
npm ci
npm run dev
```

Open [the local site](http://localhost:3000/). Guest browsing, the cart, and order previews work with the default setup.

<details>
<summary><strong>Enable email sign-in</strong></summary>

Add the public Supabase configuration to `.env.local` for development and to the Vercel build environment for deployment.

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Enable the email provider and use the default magic-link template with `{{ .ConfirmationURL }}`. Allow the deployed and local `/login` URLs in Supabase and configure a mail sender for public signup. Open the email link in the same browser that requested it to complete PKCE. [Supabase email setup](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [Publishable keys](https://supabase.com/docs/guides/getting-started/api-keys)

</details>

<details>
<summary><strong>Build and verify</strong></summary>

```sh
npm run check                 # lint, unit tests, and production build
npx playwright install chromium
npm run test:e2e              # production build and desktop/mobile browser tests
npm audit
```

Run `npm run preview` after the production build to serve it locally. Browser checks cover keyboard ordering, dialog accessibility, validation, preview cancellation and recovery, and cart updates across tabs. Set `PLAYWRIGHT_CHROME_PATH` to an absolute Chrome executable path to use an installed browser.

</details>

## Under the hood

React and TypeScript power the interface. Vite builds the site, CSS Modules keep component styles local, and the hero uses native scroll progress with a static path for reduced motion.

| Area | Where to start |
| :--- | :--- |
| Meal assembly | [Landing hero](src/features/landing/components/LandingHero.tsx) · [WebGL scene](src/features/landing/services/burgerScene.ts) |
| Catalog and preview pricing | [Sample menu](src/features/menu/services/menuService.ts) · [App configuration](src/constants/config.ts) |
| Cart and checkout | [Cart service](src/features/cart/services/cartService.ts) · [Checkout service](src/features/checkout/services/checkoutService.ts) |
| Account sign-in | [Supabase auth service](src/features/auth/services/authService.ts) |

<details>
<summary><strong>How preview data is stored</strong></summary>

The cart stores product IDs and bounded quantities in local storage. The bundled catalog supplies prices, and open tabs synchronize cart changes. The preview uses a ₹149 minimum subtotal, ₹35 delivery below ₹499, and 5% estimated tax. Delivery fields validate Indian mobile numbers and six-digit PIN codes.

The latest preview lives in session storage for the current tab. Use **Clear preview** to remove it. Cancelling a pending preview preserves the cart. Saving subtracts the previewed quantities and preserves later additions.

</details>

The [project map](docs/PROJECT_MAP.md) and [contributor guide](AGENTS.md) explain the feature boundaries. The [baseline audit](docs/AUDIT.md) and [fixes and launch gaps](docs/FIXES.md) track remediation and the work needed for live fulfillment. The [Vercel configuration](vercel.json) defines SPA routing and security headers.

## License

[MIT](LICENSE) © Mahi Patni. The gallery and demos are captures of the running app. Food artwork is illustrative, and the self-hosted fonts include their [licenses](public/fonts/).

<div align="center"><sub><a href="#soul-bites">Back to top ↑</a></sub></div>
