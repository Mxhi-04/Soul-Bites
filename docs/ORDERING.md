# Soul Bites ordering and launch guide

## Payment provider decision

Razorpay Standard Checkout is a reasonable first choice for an India-first, INR food storefront if the merchant account and website are approved. It supports server-created orders, hosted payment entry, test mode, captures, signed webhooks, and refunds. Soul Bites stores the amount and verifies the payment on the server before sending the order to the kitchen. [Razorpay web integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps) · [Razorpay security checklist](https://razorpay.com/security/checklist)

Razorpay advertises a standard 2% platform fee plus GST on that fee, with account-specific pricing and promotional terms. Cashfree is a viable alternative with hosted checkout and UPI, and publishes different rates by payment method and offer. Compare the actual offers for your account, including UPI and card fees, GST, payout timing, refunds, disputes, and support. For example, a 2% platform fee with 18% GST on the fee costs ₹7.08 on a ₹300 payment before any account-specific adjustments. [Razorpay pricing](https://razorpay.com/pricing/) · [Cashfree pricing](https://www.cashfree.com/payment-gateway-charges/)

Cash on delivery is handled by Soul Bites. The kitchen sees the amount due, and a staff member confirms cash collection when marking the order delivered. For launch, only enable COD in the PIN codes you can serve and reconcile cash against delivered orders at the end of the shift.

## What we used from Zomato and Swiggy

| Observed pattern | Soul Bites implementation |
| --- | --- |
| Zomato’s partner workflow allows acceptance or rejection and customer-facing status updates. | A waiting queue, an explicit Accept action, and a customer-facing reason when staff decline. |
| Zomato separates preparation and delivery estimates and records when food is ready. | Staff set prep and delivery minutes at acceptance. The console records Preparing, Ready, Out for delivery, and Delivered. Dispatch refreshes the arrival estimate using the recorded delivery duration. |
| Swiggy describes a checkout-to-tracking flow and separate customer-facing order status fields. | A private tracking link shows the kitchen decision, status timestamps, payment state, and an estimated arrival time in IST. The kitchen controls each update. |

[Zomato partner ordering terms](https://www.zomato.com/policies/online-ordering/) · [Zomato preparation-time engineering](https://www.zomato.com/blog/food-preparation-time/) · [Swiggy food delivery overview](https://www.swiggy.com/corporate/our-business/) · [Swiggy order tracking reference](https://mcp.swiggy.com/builders/docs/reference/food/track_food_order/)

## Set up test ordering

1. Apply [the ordering migration](../supabase/migrations/202611100001_commerce.sql) and then [the delivery radius migration](../supabase/migrations/202611100002_delivery_radius.sql) to the intended Supabase project. Both modes start paused. Database grants and RLS restrict order data and staff membership to the server.
2. Enable Supabase email sign-in and email confirmation, then configure email delivery. Add `/login` and `/login?next=admin` on your local or staging origin to the allowed redirect URLs. Open the staff sign-in link in the same browser that requested it. [Supabase email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless) · [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
3. Have the kitchen owner sign in at `/login?next=admin` to verify their email. In Supabase **Authentication → Users**, locate the confirmed account and copy its UUID. Grant kitchen access in the SQL Editor under an administrator account.

   ```sql
   insert into public.kitchen_staff (user_id)
   values ('REPLACE_WITH_VERIFIED_AUTH_USER_UUID')
   on conflict do nothing;
   ```

4. Copy [the environment template](../.env.example) to `.env.local` or configure matching variables in Vercel. Use `COMMERCE_MODE=test`, an exact origin without a trailing slash, and a random 32-byte access secret. Generate the secret with `openssl rand -hex 32`. The secret protects existing tracking links, so keep it stable and private. Put only the publishable Supabase key and URL in the `VITE_` variables. For test pricing, sample values for `COMMERCE_MINIMUM_PAISE`, `COMMERCE_DELIVERY_PAISE`, `COMMERCE_FREE_DELIVERY_PAISE`, and `COMMERCE_TAX_BPS` are `14900`, `3500`, `49900`, and `500`, respectively. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
5. In Razorpay Test Mode, set up automatic capture and enable online checkout with the test key ID, key secret, and a separate webhook secret. Create a webhook for the HTTPS staging URL:

   ```text
   https://YOUR-STAGING-DOMAIN/api/commerce?action=webhook
   ```

   Subscribe to `payment.captured`, `refund.processed`, and `refund.failed`. Webhooks require a publicly reachable endpoint. Use the Razorpay Dashboard to inspect delivery attempts. [Capture settings](https://razorpay.com/docs/payments/payments/capture-settings/) · [Validate and test Razorpay webhooks](https://razorpay.com/docs/webhooks/validate-test)
6. Sign in at `/admin`, select **Open kitchen** in test mode, and run one COD order and one Razorpay test payment. Keep the checkout tracking link open in a separate tab. Accept the order, check its ETA, advance it to Delivered, and verify the cash collection check. Decline a captured test order and issue a full refund, then check the final state in Razorpay and on the private tracking page.

## Launch domain and delivery area

- Deploy the [Hostinger Node.js entry point](../server/start.mjs) using the [README procedure](../README.md#launch-on-hostinger). Connect `soulbites.in` in hPanel and use the DNS records it provides. Use `https://soulbites.in` as `COMMERCE_ORIGIN` and as the Supabase Auth Site URL. Allow `https://soulbites.in/login` and `https://soulbites.in/login?next=admin` in Supabase Auth. If using `www.soulbites.in`, redirect it to the apex so the storefront and checkout share one origin. [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- Set `COMMERCE_DELIVERY_RADIUS_METRES=5000` and use the operator-provided dispatch coordinates for `COMMERCE_KITCHEN_LATITUDE` and `COMMERCE_KITCHEN_LONGITUDE`. The kitchen is at Eminent Towers near Asian World School in Jasingpura, Bhankrota, PIN 302026. Leave `COMMERCE_DELIVERY_PINS` empty for radius-based launch coverage. Checkout verifies each customer's submitted PIN and accepts addresses strictly under 5 km in a straight line from the kitchen, including eligible neighboring PINs.
- Enable Google Geocoding API on a billed Google Cloud project and set a server-only `GOOGLE_GEOCODING_API_KEY`. Restrict the key to Geocoding API and set a daily quota. For PIN-only test ordering, leave the radius, both coordinates, and key empty, and set `COMMERCE_DELIVERY_PINS` to a sample PIN. Live ordering requires the radius, both coordinates and the geocoding key. [Geocoding billing and quotas](https://developers.google.com/maps/documentation/geocoding/usage-and-billing) · [Google Maps Platform key restrictions](https://developers.google.com/maps/api-security-best-practices)
- Verify known addresses in staging inside the radius, outside it within the kitchen's PIN, and inside it with a neighboring PIN. Also try a mistyped PIN and incomplete address. The server accepts a unique street-level match with an exact PIN and a rooftop or interpolated position. Verify how common those matches are in this delivery area before opening live orders. [Geocoding response fields](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding)

## How checkout and tracking work

- The server validates the delivery PIN and canonical catalog prices in paise. Where the radius applies, it sends only the street, city and PIN to Google for address verification before creating the order. The service uses the response to check eligibility and discards the provider results. Same-key retries return the same reservation, and database transactions limit repeated lookups and submissions.
- COD enters the waiting queue immediately. Razorpay orders enter it after a matching capture is verified. An authorized payment stays in Awaiting payment. The private tracking page can resume or check the existing payment.
- The database guards simultaneous kitchen updates with an order revision. Staff can pause new orders from the console. Existing tickets and payment webhooks stay available while paused.
- A declined paid order appears under **History & refunds**. Staff issue a full refund explicitly and track provider confirmation. Use the Razorpay dashboard to reconcile failed or unusual refunds. No partial refunds are available in the console.
- Customer tracking shows a limited view of one order through an unguessable token in the link fragment. Delivery details are visible to allowlisted staff. The browser remembers the latest link for the current account or guest session on that device. Keep the private link to check from another device.
- A timed-out Razorpay order creation is checked by receipt. If it is still missing after 30 seconds, a guarded retry uses the same receipt. The browser receives only the gateway order linked in the database. Staff should reconcile ambiguous references before advising a new order. [Fetch Razorpay orders](https://razorpay.com/docs/api/orders/fetch-all)

## Launch gate

- Verify HTTPS, redirects, the `/api/commerce` route, and the live checkout frame and payment methods on a phone. On the production domain, the order API must report `mode: "live"`. An unconfigured deployment blocks ordering and preserves the customer's cart.
- Confirm service hours, checkout amounts, and tax treatment. Grant `kitchen_staff` access to the verified Supabase Auth account of the kitchen owner.
- Publish verified business, contact, delivery, refund, privacy, and food information. Include Google’s terms and privacy links in the public terms and privacy notices for address verification. Verify the applicable FSSAI licence or registration for the cloud kitchen and complete Razorpay merchant activation. [Google Geocoding policies](https://developers.google.com/maps/documentation/geocoding/policies) · [FSSAI licensing FAQ](https://www.fssai.gov.in/upload/uploadfiles/files/FAQs_Licensing_Registration_26_07_2022.pdf) · [Razorpay go-live steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps#3-go-live-checklist)
- Keep test and live secrets and webhook settings separate. Set the production Razorpay webhook to `https://soulbites.in/api/commerce?action=webhook`. Use the kitchen pause control during service interruptions so existing online orders and refunds remain available. Store credentials in the hosting environment. Restrict staff access to verified accounts and revoke it promptly when needed.
- Once the staging checks pass, deploy the live environment with `COMMERCE_MODE=live`. Start with the kitchen paused, run an operator-reviewed smoke test, and open orders from `/admin` when ready. Monitor the queue and reconcile Razorpay and cash totals during service.

The console uses periodic refresh and staff-managed delivery status. Order updates are visible through the tracking link. A notification service, inventory management, and courier dispatch integration remain separate work.
