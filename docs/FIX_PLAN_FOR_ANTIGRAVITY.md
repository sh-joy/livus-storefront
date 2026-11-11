# LIVUS — Fix Plan (review of the "completed" build)

Reviewed on branch `claude-first-change` with the working-tree changes applied.
**What is verified working:** `tsc` clean, `next build` 41/41, live DB schema matches `schema.ts`
(migrations 0001 + 0002 applied), DB-driven marquee shows on the storefront, reviews section
renders, checkout delivery tiers are correct (Dhaka ৳100 / others ৳150 / free ≥ ৳2,500), and the
server quote matches the checkout total.

The items below are what is **broken, unsafe, or missing**. Work through them in order.
P0 = must fix before taking real orders. P1 = before marketing launch. P2 = soon after.

## Ground rules (do not regress these)
- All money math stays in `src/lib/order-pricing.ts` (`quoteOrder`). Never compute totals/prices in the browser for saving.
- Every admin server action must start with `await requireAdmin()` (`src/lib/admin-guard.ts`). Never trust the readable `livus_admin_*` cookies.
- Customer data actions must derive identity from the Better Auth session (`auth.api.getSession`), never from arguments.
- Never return database error text (`err.message`) to the browser.
- Schema changes go in a new additive file in `drizzle/manual/` (CREATE … IF NOT EXISTS / ADD COLUMN IF NOT EXISTS). Never drop or rename columns.

---

## P0 — fix before real orders

### 1. Guests can cancel anyone's order — `cancelCustomerOrderAction` (src/app/actions/orders.ts)
The ownership check only runs `if (sessionUser)`. A signed-out caller can cancel any Pending order by
order number (old order numbers are 4–5 digits, trivially guessable). It also has a race: two calls can
both pass the `status === 'pending'` check and restore stock twice.
**Fix:**
- If not signed in: require the order's phone number as a second argument and compare with `normPhone()`; otherwise return "not authorized".
- If signed in: keep the email / customer-phone ownership check.
- Make the status change atomic: `UPDATE orders SET status='Cancelled' … WHERE id = ? AND status = 'Pending' RETURNING id`. Only restore stock and send the email if a row came back.
- Update the Profile cancel UI for guests to pass the phone they searched with.
**Done when:** a signed-out request with only an order number fails; double-clicking Cancel restores stock once.

### 2. bKash / Nagad merchant numbers are placeholders
Live `store_settings` has `bkash_merchant_number = 01711000000`, `nagad_merchant_number = 01811000000`,
`support_phone = +880 1711 000000`. Checkout tells customers to **send money to these numbers**.
Defaults are also hard-coded in `schema.ts`, `admin-actions.ts` and `CheckoutPage.tsx` (`|| '01711000000'`).
**Fix:**
- Remove the fake fallbacks everywhere (schema default → empty string, CheckoutPage fallback → none).
- In checkout, hide the bKash option unless a valid BD number (`/^01[3-9]\d{8}$/`) is configured; same for Nagad.
- Server: `placeOrderAction` must reject `bkash`/`nagad` if that number isn't configured.
- Admin settings: validate the numbers on save.
**Done when:** with empty numbers, bKash/Nagad don't appear and the server refuses them.

### 3. bKash / Nagad payments are never actually verified
`paymentStatus` gets the TrxID stuffed into it, and setting an order to **Delivered** auto-writes
"Paid (bKash Verified)" even if nobody checked the transaction. The same TrxID can also be reused on many orders.
**Fix:**
- Server: for bkash/nagad require `trxId` (8–12 alphanumeric) and `senderPhone` (valid BD number); reject if the same TrxID already exists on another order.
- Store payment status as a clean value: `Awaiting Verification`. Keep TrxID/sender phone in their own place (add nullable `payment_trx_id`, `payment_sender_phone` columns via a new manual migration; keep the instructions copy for display only).
- Admin order drawer: add **Verify payment** / **Reject payment** buttons (new admin action) that set `Paid (bKash Verified)` / `Payment Failed`. Remove the automatic "Verified" on Delivered for bkash/nagad.
**Done when:** a reused TrxID is rejected and Delivered no longer marks unchecked payments as verified.

### 4. Emails may never send on Vercel (fire-and-forget)
`sendOrderConfirmationEmail(...).catch()` and `sendOrderStatusNotificationEmail(...).catch()` are not
awaited (checkout.ts, orders.ts, admin-actions.ts). On Vercel the function can stop right after responding,
so the email is silently dropped.
**Fix:** wrap each in `after(() => …)` from `next/server` (Next 16 supports it in server actions), or `await` them inside try/catch.
**Done when:** every email send is inside `after()` or awaited.

### 5. Email HTML injection
`src/lib/email.ts` and `abandoned-carts.ts` insert customer-supplied text (name, address, product/variant names, customMessage) straight into HTML.
Someone can put links/HTML in their name and get a LIVUS-branded email sent with it.
**Fix:** add `escapeHtml()` in `email.ts` and use it for every interpolated value.

### 6. Re-opening a cancelled order double-sells stock
Admin `updateOrderStatusAction`: Cancelled → Pending/Processing does not take stock back, so the items are sold twice.
**Fix:** when moving *from* Cancelled to any active status, re-reserve stock using `reserveStock` logic (fail with a clear message if it's no longer available). Make the cancel itself atomic like item 1 (`WHERE status <> 'Cancelled'`).

---

## P1 — before the marketing launch

### 7. Admin shipping settings do nothing
`quoteOrder` hard-codes ৳100 if the region contains "dhaka" else ৳150, and ignores both
`shipping_regions` (edited in Admin → Settings) and `store_settings.default_delivery_charge_bdt`.
Also the DB has "Barisal Division" while checkout sends "Barishal Division".
**Fix:** look up the region in `shipping_regions` (case-insensitive, normalise Barisal/Barishal), fall back to `default_delivery_charge_bdt`. Keep the free-shipping threshold.
Decide (and document) whether free shipping uses subtotal **before or after** promo discount — currently before.
**Done when:** changing a region's fee in admin changes the checkout total.

### 8. Public endpoints can be spammed
`saveAbandonedCheckoutAction`, `submitProductReviewAction`, `addNewsletterSubscriberAction`, `sendOtpVerificationAction` have no rate limits.
- Abandoned checkout: anyone can overwrite another person's row by phone (and set any email → admin then sends a "recovery" email to that address). Only update rows created in the same browser session (store the row id in a cookie / localStorage and require it to update); cap `itemsJson` size; compute `subtotalBdt` on the server via `quoteOrder` instead of trusting the client.
- Reviews: validate `productId` exists and is active; cap lengths (name 60, headline 120, comment 2000); limit per IP/email per day. Remove the word **"Verified"** from the reviews heading unless you actually check the reviewer bought the product (match email to a Delivered order).
- Add a simple rate limiter (per IP via `headers().get('x-forwarded-for')`, stored in the DB or Upstash) for these four actions.

### 9. Marketing essentials missing
- **Per-product SEO:** `src/app/product/[slug]/page.tsx` has no `generateMetadata` — every product shares the same title. Add title, description, canonical, and Open Graph image (first product photo). Do the same for category pages.
- **`src/app/sitemap.ts`** (all active products + category pages) and **`src/app/robots.ts`** (disallow `/admin`, `/api`, `/checkout`, `/profile`).
- **Meta Pixel + GA4** (env-driven IDs, e.g. `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`): PageView, ViewContent (product page), AddToCart, InitiateCheckout, Purchase (order-confirmed, with value + currency BDT). Without this, ad campaigns can't be measured or optimised.
- **`src/app/not-found.tsx`** (use the existing `imports/PageNonFound`) and **`src/app/error.tsx`**.
- **Policy pages:** Privacy, Terms, Shipping & Returns, About, Contact. Menu "About", "Contact" and "Gift Card" currently link to `/` or `/all-products`; footer social links are placeholders (`facebook.com/`, `instagram.com/`, `hello@livus.com`) — use real ones from store settings.

### 10. Hard-coded domain
`https://livus.com.bd/...` is hard-coded in `email.ts` and `abandoned-carts.ts`. Use `process.env.NEXT_PUBLIC_APP_URL`.

### 11. Product photos are hot-linked from another brand
109 of 110 product images load from `cdn.gentlepark.com`. Replace with LIVUS photos uploaded through
the admin (uploads go to Vercel Blob once `BLOB_READ_WRITE_TOKEN` is set).

---

## P2 — soon after
- Marquee actions revalidate only `/`; use `revalidatePath('/', 'layout')` so every page updates.
- Analytics "Gross revenue" counts unpaid Pending orders — label it "Order value" or count Delivered/verified-paid only.
- Abandoned checkouts are marked recovered by phone only; also match by email.
- Promo `usage_limit` column exists but isn't enforced (needs a `promo_code` column on orders + count check).
- Order confirmation page reads the total from the URL; fetch it from the server for the signed-in owner instead.

## How to verify when finished
1. `npx tsc --noEmit` and `npm run build` pass.
2. Signed-out: cancelling with only an order number fails; with the right phone it succeeds once.
3. Empty bKash number → bKash hidden at checkout and rejected by the server.
4. Reused TrxID rejected; Delivered does not mark bKash as verified.
5. Edit Sylhet's fee in Admin → Settings → checkout shows the new fee.
6. Product pages have unique `<title>`; `/sitemap.xml` and `/robots.txt` load; unknown URL shows the 404 page.
7. Meta Pixel helper shows PageView / AddToCart / Purchase on a test order.
