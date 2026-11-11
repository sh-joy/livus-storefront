# Handoff to Antigravity — Round 3 (backend, data, admin, tests)

Claude is working **at the same time** on the storefront design (header, hero, footer, typography).
To avoid overwriting each other, follow the file ownership below exactly.

## File ownership

### Claude owns — do NOT edit these files
- `src/figma-components/SiteNav.tsx`
- `src/figma-components/SiteFooter.tsx`
- `src/figma-components/MenuDrawer.tsx`
- `src/figma-components/AnnouncementMarquee.tsx` (UI only — keep using `getActiveMarqueeAnnouncementsAction` as is)
- `src/figma-components/ProductCard.tsx`
- `src/imports/Homepage/index.tsx`
- `src/imports/ForHim-2/index.tsx`, `src/imports/ForHer/index.tsx`
- `src/app/all-products/AllProductsClient.tsx`
- `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/fonts.ts`
- anything new under `src/components/storefront/`

If one of your tasks truly needs a change in these files, **don't make it** — write it under "Requests for Claude" in your final summary.

### Antigravity owns — everything else
`src/app/actions/**`, `src/lib/**` (except `fonts.ts`), `src/db/**`, `drizzle/**`, `src/app/admin/**`, `src/app/api/**`,
`src/figma-components/CheckoutPage.tsx`, `CartDrawer.tsx`, `ProfilePage.tsx`, `SignInPage.tsx`, `SignUpPage.tsx`, `InputField.tsx`,
`src/imports/ProductDetails-1/**`, `src/imports/OrderConfirmed/**`, `src/components/**` (except `storefront/`), tests, CI, docs.

## Do NOT change (owner will handle later)
- Footer social links and the About / Contact / Privacy / Terms / Shipping & Returns page text.

## Run these as parallel agents (each track only touches its own files)

### Track 1 — Pricing & checkout
Files: `src/lib/order-pricing.ts`, `src/app/actions/checkout.ts`, `src/figma-components/CheckoutPage.tsx`, `src/lib/email.ts`, `src/lib/invoiceGenerator.ts`
1. **Standard VAT & free-delivery rule (owner decision: "use what is standard"):**
   - Apply the promo discount **first**. `taxable = subtotal − discount`.
   - `VAT = round(taxable × vatPercent / 100)` — VAT on the discounted amount, not the original price.
   - Free delivery when `taxable ≥ freeShippingThreshold` (the amount actually paid for goods), not the pre-discount subtotal.
   - `total = taxable + VAT + delivery`.
   - Update the checkout summary, free-delivery progress text, order confirmation email and invoice so they all show the same numbers.
   - Example to verify: 2 × ৳1,665 with GIFT2000 → subtotal 3,330, discount 2,000, taxable 1,330, VAT 133, delivery 150 (Sylhet), total **1,613**.
2. **Rate-limit order placement:** `checkRateLimit('place_order', 5, 60000)` at the top of `placeOrderAction` (before any DB work).
3. **Privacy note at checkout (SQA M8):** one short line under the contact fields: "We save your details while you check out so you can finish your order later." Mention it in the Privacy page later (owner will edit text).

### Track 2 — Catalogue data & admin
Files: `src/app/actions/products.ts`, `src/app/actions/admin-actions.ts`, `src/app/admin/**`, `drizzle/manual/0005_*.sql`
1. **Accessories category (owner approved):** create category `Accessories` (slug `accessories`) and move **Red Silk Tie, Silver Cufflinks, Black Leather Belt** into it in the live Neon DB.
   Write it as an idempotent script `drizzle/manual/0005_accessories_category.sql` (`INSERT … ON CONFLICT DO NOTHING`, `UPDATE products … WHERE slug IN (…)`) and run it. Confirm `/accessories` shows 3 products and they no longer appear under For Him / Unisex.
2. **Customers lifetime value (SQA H4):** Admin → Customers must calculate order count and total spend from the `orders` table (by phone or email, excluding Cancelled), not from the counter columns. One-off backfill: link existing orders to customer rows by phone (create the customer row if missing).
3. **Region spelling (SQA L3):** use "Barishal Division" everywhere (DB `shipping_regions`, admin, checkout list). Make region matching tolerant of both spellings.
4. **Dashboard labels (SQA L4):** "Gross Sales — From confirmed client orders" counts Pending orders. Either exclude Pending/Cancelled, or relabel to "Order value (all non-cancelled orders)". Same on Analytics.

### Track 3 — Security & customer pages
Files: `src/app/actions/subscribers.ts`, `src/app/actions/auth-actions.ts`, `src/app/actions/orders.ts`, `src/app/actions/reviews.ts`, `src/imports/OrderConfirmed/**`
1. **Rate limits** on the remaining public actions: newsletter subscribe (5/min), send reset/verification code (3/10 min per IP and per email), guest order lookup + cancel (10/min).
2. **Order confirmed page (SQA M5):** load the order from the server — show details only if the visitor owns it (signed-in email match, or the order phone passed from checkout via a short-lived signed cookie). Otherwise show "Thank you" without order details. Never trust `total` from the URL.

### Track 4 — Automated tests & CI (new files only)
1. Add **Vitest** with unit tests for `order-pricing.ts` math (VAT on discounted amount, free-delivery threshold, promo caps, delivery per division) — mock the DB layer.
2. Add a GitHub Actions workflow that runs `npm ci`, `npx tsc --noEmit`, `npm run lint -- --quiet` (allow existing warnings), `npm test`, `npm run build` on every push / PR (build can use a dummy `DATABASE_URL` if pages need it; skip DB-dependent steps if necessary).
3. Update `.env.example` with **every** variable the app reads (no real values): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, Brevo keys, Google/Facebook keys, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`, etc.

## Rules (same as before)
- `'use server';` must be **line 1** of every file in `src/app/actions/`.
- Money math only in `order-pricing.ts`. Admin actions start with `requireAdmin()`. Customer identity from the session only.
- Live DB changes: additive migrations + the one accessories data script only. Never drop or rename columns.
- After all tracks finish: `npx tsc --noEmit`, `npm run build`, then **one commit per track** on branch `claude-first-change` with a clear message. Do not push or merge.

## Final summary to the owner
List per track: done / not done, files changed, how you verified, and any "Requests for Claude".
