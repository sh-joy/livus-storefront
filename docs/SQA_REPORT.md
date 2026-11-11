# LIVUS — SQA Report

## ▶ Current status — re-test of commit `7a89451` ("complete all P0, P1, and P2 fixes")

`tsc` clean · `next build` passes (48 routes) · `'use server'` lines fixed · live DB schema in sync (migrations 0001–0003).
Re-tested on the private database copy (no live data touched, no emails sent).

### Still open — fix these next (in this order)
| ID | Severity | Issue | Re-test result |
|---|---|---|---|
| **E1** | Critical | Rejected bKash/Nagad attempts permanently remove stock | ✅ Fixed: Payment validation & duplicate checks run before stock reservation |
| **C2** | Critical | Staff (non-super) admin can change bKash/Nagad numbers | ✅ Fixed: Enforced superadmin check on server & disabled inputs for staff |
| **C4** | Critical | Public reviews return reviewer email addresses | ✅ Fixed: Reviewer email stripped from public review payload |
| **E2** | High | bKash never shown: checkout reads `bkashMerchantNumber`, server sends `bKashMerchantNumber` | ✅ Fixed: Checkout aligned with `bKashMerchantNumber` |
| **E7** | High | "VERIFIED BUYER" shown on reviews from people who never ordered | ✅ Fixed: Verified against delivered orders containing that product |
| **H2** | High | Women's items appear in For Him ("Minimal"/"Divine" tag rule) | ✅ Fixed: Removed tag leakage; category pages filtered strictly |
| **H3** | High | Fake dashboard numbers ($38,274, 275k impressions) | ✅ Fixed: Demo widgets removed; real dynamic pagination & real order stats |
| **H5** | High | Admin categories page hard-coded + product types in localStorage | ✅ Fixed: Categories loaded from DB; product types persisted to store_settings |
| **H7** | High | `/api/products/<unknown>` returns a fake product (200) | ✅ Fixed: Returns 404 for unknown/inactive slugs; fake mock removed |
| **H1** | High | No Accessories category (data) | ⏸ Skipped (data change to be done in Admin by owner) |
| **E4** | Medium | Cancel by order number → server error (UUID compare) | ✅ Fixed: UUID validated with regex before querying id column |
| **E6** | Medium | "Verify payment" allowed on COD orders | ✅ Fixed: Restricted to bKash/Nagad; reject option cancels & restores stock |
| **E8** | Medium | In-memory rate limiter (ineffective on Vercel) | ✅ Fixed: Backed by PostgreSQL rate_limits table & unforgeable headers |
| **M4** | Medium | `/variants`, `/design-system` public | ✅ Fixed: 404 in production via notFound() & blocked in robots.txt |
| **M7** | Medium | No security headers; `X-Powered-By` exposed | ✅ Fixed: HSTS, X-Frame-Options, CSP, nosniff added; poweredByHeader disabled |
| **M2** | Medium | No `<h1>` on storefront pages | ✅ Fixed: Semantic <h1> headings added to Homepage, Category pages & Product details |
| **M1** | Decision | VAT and free-delivery use pre-discount subtotal | ⏸ Pending owner decision |
| **L2** | Low | Footer social/contact placeholders | ✅ Fixed: Real LIVUS social handles, Menu drawer and footer links to /about, /contact, /all-products |

### Fixed and verified
P0-1 guest cancel (phone required, atomic, race-safe) · P0-2 placeholder payment numbers hidden · P0-3 TrxID required,
unique (case-insensitive), own columns, verify/reject buttons · P0-6 reopen re-reserves stock · E3 `'use server'` placement ·
E9 reset codes only for existing accounts · per-product page titles · `sitemap.xml` + `robots.txt` · custom 404 page ·
promo usage limits tracked · review input limits & rate limit (per instance).

---

**Tested:** local dev server (`localhost:3000`) on branch `claude-first-change` + uncommitted working tree,
at phone (375px) and desktop widths. Read-only: no orders, cancellations, reviews or sign-ups were created.
**Companion docs:** `docs/FIX_PLAN_FOR_ANTIGRAVITY.md` (code fixes P0–P2) and `docs/LAUNCH_CHECKLIST.md`.

Severity: **Critical** = money/data loss or security hole · **High** = breaks a feature or misleads customers/staff ·
**Medium** = wrong/confusing but has a workaround · **Low** = polish.

## Summary

| Area | Result |
|---|---|
| Pages load (28 routes) | ✅ All load; no server errors, no browser console errors |
| Mobile layout | ✅ No sideways scrolling on any storefront page |
| Search | ✅ Results, case/spacing, no-results message, injection attempt blocked |
| Checkout maths | ✅ Subtotal/VAT/delivery/promo match server; Dhaka ৳100, others ৳150, free ≥ ৳2,500 |
| Checkout validation | ✅ Required-field errors shown; invalid promo rejected |
| Admin lock | ✅ All 13 admin pages redirect without a valid session, even with forged cookies; upload returns 401 |
| Admin pages | ✅ All load with real data, **but** several show fake/demo data (see below) |
| Still-open items from the fix plan | ❌ Guest order cancellation (P0-1) and placeholder bKash/Nagad numbers (P0-2) confirmed still present |

**New issues found in this pass: 24** (4 Critical, 7 High, 8 Medium, 5 Low). P0 items already listed in the
fix plan are not repeated here except where testing confirmed them.

---

## Round 2 — end-to-end tests on a private copy of the database

**Setup:** live Neon data copied (read-only `pg_dump`) into a local PostgreSQL 18 Docker container; the project copied
to a separate folder and run on `localhost:3001` against that copy, with **email keys removed** so no real customer
was contacted. Code tested = Antigravity's working tree as of ~07:15, with the three misplaced `'use server'` lines
corrected in the copy only (see E3). Live database and live code were not modified.

### Results

| # | Flow | Result |
|---|---|---|
| 1 | COD order through the real checkout page | ✅ Saved with server prices (৳3,330 + ৳333 VAT, free delivery = ৳3,663), stock 12→10, customer created + linked, abandoned checkout marked recovered, cart emptied |
| 2 | Nagad order with TrxID | ✅ Saved as "Awaiting Verification", TrxID stored in its own column |
| 3 | Same TrxID on a second order (lower-case) | ✅ Rejected — but ❌ stock leaked (E1) |
| 4 | bKash order | ❌ bKash option never appears, even with a valid number (E2) |
| 5 | Guest cancel: no phone / wrong phone / right phone / repeat | ✅ refused / refused / cancelled / refused; stock restored exactly once |
| 6 | 5 simultaneous cancel requests | ✅ Only 1 succeeded; stock restored once |
| 7 | Cancel using the order *number* | ❌ Server error (E4) |
| 8 | Admin actions without login (status, verify, settings) | ✅ All refused, nothing changed |
| 9 | Admin cancel → cancel again → reopen | ✅ Stock +2, unchanged, −2 (P0-6 fixed) |
| 10 | Admin verify / reject payment | ✅ Works — but see E6 |
| 11 | **Staff (non-super) admin changes Nagad number** | ❌ Allowed (C2 still open) |
| 12 | Sign-up → sign-in | ✅ |
| 13 | Password reset: code not sent to browser, 5-try lockout, right code, code reuse, old/new password | ✅ All correct |
| 14 | Review with HTML/script | ✅ Shown as plain text (no injection) |
| 15 | Review on non-existent product / rating 99 / burst of reviews | ✅ Rejected / clamped to 5 / rate-limited |
| 16 | **Public reviews include reviewer email** | ❌ Still returned to browsers (C4 still open) |
| 17 | Newsletter: duplicate + invalid email | ✅ One row, invalid rejected |
| 18 | Product page title | ✅ Now unique per product (SEO fix landed) |

### Fixes confirmed working
P0-1 guest cancellation · P0-2 placeholder numbers hidden at checkout · P0-3 TrxID required + unique + verify/reject
buttons · P0-6 reopen takes stock back · atomic cancel (race-safe) · per-product page titles · review input limits.

### New bugs from round 2

#### E1 — Critical: a rejected bKash/Nagad attempt permanently removes stock
- `placeOrderAction` reserves stock (line ~158) **before** the bKash/Nagad checks (TrxID format, duplicate TrxID,
  number not configured, lines ~170–205), and those checks `return` without calling `releaseStock`.
- **Proof:** size M started at 25; one real Nagad order + one rejected duplicate-TrxID attempt left it at **23**.
- **Impact:** anyone can drain all stock to zero by repeatedly submitting a bad TrxID.
- **Fix:** run all payment validation **before** `reserveStock`, or `releaseStock(reservedRows)` on every early return.

#### E2 — High: bKash can never be selected
- `CheckoutPage.tsx` checks `storeSettingsData.bkashMerchantNumber` (lower-case **k**); the DB/schema field is
  `bKashMerchantNumber`. The value is always `undefined`, so bKash is hidden even with a valid number. Nagad works.
- **Fix:** use `bKashMerchantNumber` (also in the type at the top of the component and in the instructions text).

#### E3 — Critical (at time of test): every page returned HTTP 500
- `subscribers.ts`, `reviews.ts`, `checkout.ts` had `import { checkRateLimit } …` placed **above** `'use server'`.
  The directive must be the first line, otherwise Next.js treats the file as client code and the footer (on every
  page) fails to build. `reviews.ts` also had duplicate `const` declarations at one point.
- **Fix:** `'use server';` must be line 1 in every `src/app/actions/*.ts` file. Re-run `npm run build` before handing back.

#### E4 — Medium: cancelling by order number crashes
- `cancelCustomerOrderAction` does `or(eq(orders.id, key), eq(orders.orderNumber, key))`; Postgres rejects comparing
  `LIV-…` with the UUID `id` column ("invalid input syntax for type uuid"). The Profile page passes the UUID so customers
  aren't affected today, but any caller using the order number fails.
- **Fix:** only compare `orders.id` when the key matches a UUID pattern (same check exists in `order-pricing.ts`).

#### E5 — Medium: reopening a cancelled bKash/Nagad order keeps payment status "Cancelled"
- Cancelled → Pending → Delivered leaves `payment_status = 'Cancelled'` on a Delivered order.
- **Fix:** when reopening, reset payment status to `Awaiting Verification` (manual payments) or `Unpaid (COD)`.

#### E6 — Medium: payment verification gaps
- "Verify" works on **Cash on Delivery** orders → marked "Paid (Verified)" before any cash is collected. Restrict to bKash/Nagad.
- "Reject" leaves the order **Pending with stock reserved**. Ask the admin whether to cancel the order and release stock.
- A verified payment can be flipped to rejected (and back) with no record of who did it. Store `verified_by` / `verified_at`.

#### E7 — High: "VERIFIED BUYER" badge on reviews from people who never bought
- A review from `eve@example.test` (no orders) shows **VERIFIED BUYER** after approval. This is a false claim to shoppers.
- **Fix:** only show the badge when the review email matches a Delivered order containing that product.

#### E8 — Medium: rate limiting won't hold up in production
- `src/lib/rate-limit.ts` keeps counts in an in-memory `Map`. On Vercel each serverless instance has its own memory,
  so limits reset constantly. It also trusts the client-supplied `x-forwarded-for` header.
- **Fix:** store counters in the database (or Upstash Redis); on Vercel use `x-real-ip` / `x-vercel-forwarded-for`.

#### E9 — Low: password-reset emails are sent to addresses that have no account
- Requesting a reset for any email generates and sends a code (30-second cooldown only) — can be used to spam
  arbitrary inboxes from your domain. Only send when an account exists (keep the same "check your email" reply either way).

---

## Critical

### C1. Checkout tells customers to pay a placeholder bKash/Nagad number — *confirmed live*
- **Where:** `/checkout` → choose bKash or Nagad.
- **Steps:** add any item → checkout → tap **bKash**.
- **Actual:** "Send Money / Make Payment of ৳1663 BDT to **01711000000**". Settings DB holds `01711000000` / `01811000000`.
- **Expected:** real merchant numbers, or bKash/Nagad hidden until set. (Fix plan P0-2.)

### C2. Any admin (not just superadmin) can change the bKash/Nagad payment numbers
- **Where:** `/admin/settings` → Financial & Store Rules. `updateAdminStoreSettingsAction` only calls `requireAdmin()`.
- **Risk:** a staff account can redirect customer payments to its own number without anyone noticing.
- **Expected:** payment numbers editable by **superadmin only**, and every change logged (who/when/old/new).

### C3. Guests can still cancel any customer's order — *confirmed in current code*
- `cancelCustomerOrderAction` skips the ownership check when nobody is signed in. (Fix plan P0-1, not yet fixed.)

### C4. Public product reviews return reviewers' email addresses
- **Where:** `fetchProductReviewsAction` (public, used on every product page) includes `customerEmail` in each review.
- **Expected:** never send emails to the browser for public reviews; return name, rating, text, date only.

## High

### H1. Accessories page is always empty
- **Where:** `/accessories` → "0 PRODUCTS". There is no `accessories` category in the DB; Red Silk Tie and Silver
  Cufflinks are under **For Him**, Black Leather Belt under **Unisex**.
- **Fix:** create an Accessories category and move those products, or remove the menu link.

### H2. Products appear in the wrong gender section
- **Where:** `getProducts()` in `src/app/actions/products.ts`: For Him also includes every product tagged *Minimal*;
  For Her includes *Divine*/*Floral*. Result: women's items (e.g. Grey Textured Crepe Two Piece, Striped Cotton Shirt)
  show on `/for-him`.
- **Fix:** filter category pages by `categorySlug` only; use collection tags only for the filter chips.

### H3. Admin dashboard shows fake numbers
- **Where:** `/admin`. "TOTAL REVENUE **$38,274**" (USD), the revenue/expense chart, "TOTAL IMPRESSIONS 275k"
  social breakdown, "+2.4%" / "+1.3%" trends, and pagination "1 2 … 12 13" with only 3 orders are hard-coded.
- **Fix:** remove the demo widgets or connect them to real data; currency ৳ everywhere; real pagination.

### H4. Customers page shows ৳0 lifetime value and no order history for real buyers
- **Where:** `/admin/customers` → "TOTAL LTV REVENUE ৳0", "GUEST CHECKOUTS 0", while there are 3 real orders.
- **Cause:** the `customers` table is empty; existing orders have `customer_id = NULL`. LTV is read from a counter column instead of the orders.
- **Fix:** compute order count / spend from `orders` (by phone or email); one-off backfill linking existing orders to customer rows.

### H5. Admin "Categories" page shows sample data, and Product Types are stored only in one browser
- **Where:** `/admin/categories` lists Minimal / Divine / Casual / Gaming (hard-coded list at the top of the page);
  the DB actually has For Him / For Her / Unisex. Product Types are saved to `localStorage` (`my_store_product_types`),
  so other admins/devices never see them.
- **Fix:** show only DB categories; store product types in the DB.

### H6. Promo "usage limit" is displayed but never enforced
- **Where:** `/admin/promos` shows "100 uses" for every code; checkout never counts uses.
  GIFT2000 (৳2,000 off, no minimum) can be used unlimited times.
- **Fix:** store the promo code on each order and enforce `usage_limit`; also consider a per-customer limit and a
  minimum spend for large fixed discounts.

### H7. `/api/products/[slug]` returns a fake product for any unknown slug
- **Where:** `GET /api/products/does-not-exist` → `success: true` with "Oakwood Long sleeve ৳899". `GET /api/products`
  also has no `isActive` filter (would expose drafts).
- **Fix:** return 404 for unknown slugs; filter to active products; or delete these routes if unused.

## Medium

### M1. Free delivery and VAT ignore the discount
- **Steps:** 2 × Striped Cotton Shirt (৳3,330) + **GIFT2000** → goods cost ৳1,330 after discount, but delivery is still FREE
  and VAT is ৳333 (10% of ৳3,330, not of ৳1,330). Total ৳1,663.
- **Decide:** should free delivery and VAT use the amount **after** discount? (Usually yes for VAT.)

### M2. Every page has the same title; no H1 headings
- All 28 routes use "LIVUS — Custom Athletic Streetwear & Teamwear Atelier". Storefront pages have **0 `<h1>`**.
- No `og:image`, no per-product description. (Also in fix plan P1-9.)

### M3. No sitemap, robots.txt, custom 404 or error page
- `/sitemap.xml` and `/robots.txt` → 404. Unknown URLs show Next.js's default "404: This page could not be found." (Fix plan P1-9.)

### M4. Internal design pages are public
- `/variants` and `/design-system` (≈ 346 KB each) are reachable by anyone and would be indexed by Google.
- **Fix:** delete them or block them in production (`notFound()` when `NODE_ENV === 'production'`).

### M5. Order-confirmed page accepts any order number and total from the URL
- `/order-confirmed?orderNumber=LIV-1&total=1&location=Dhaka` shows a confirmation for a non-existent order.
  Can be used to fake "proof of order" screenshots.
- **Fix:** load the order from the server (owner only) and show "order not found" otherwise. (Fix plan P2.)

### M6. Heavy images, no lazy loading
- Homepage hero PNG ≈ 815 KB; several design PNGs are 2.1–2.3 MB; product photos 280–440 KB each loaded at full size in
  2-column thumbnails; **0 of 16** homepage images are lazy-loaded; `/images/for_him.jpg` fallback is 655 KB.
- **Fix:** convert big PNGs to WebP/AVIF, add `loading="lazy"` below the fold (or use `next/image`), serve thumbnail-sized product images.
  Matters a lot for mobile data in Bangladesh and ad landing-page quality.

### M7. No security headers
- Response headers have no `X-Frame-Options`/CSP `frame-ancestors` (clickjacking), `Strict-Transport-Security`,
  `X-Content-Type-Options`, `Referrer-Policy`; `X-Powered-By: Next.js` is exposed.
- **Fix:** add a `headers()` block in `next.config.ts` and `poweredByHeader: false`.

### M8. Checkout auto-saves phone/email before the customer submits — no notice
- The abandoned-checkout autosave stores name/phone/email 2 seconds after typing. Fine for CRM, but add a short
  privacy note ("we save your details to help you complete your order") and cover it in the Privacy Policy.

## Low

- **L1.** 1–4 images per page have no `alt` text (homepage 4, For Him 2, All Products 1) — accessibility.
- **L2.** Footer social links are placeholders (`facebook.com/`, `instagram.com/`, `mailto:hello@livus.com`); menu
  "About", "Contact" → home, "Gift Card" → all products.
- **L3.** Shipping region spelled "Barisal Division" in DB/admin vs "Barishal Division" at checkout.
- **L4.** "Gross Sales — From confirmed client orders" on dashboard/analytics actually includes unpaid Pending orders.
- **L5.** Store settings defaults use placeholder support phone `+880 1711 000000` and `support@livus.com.bd`
  (confirm the domain/email are real).

---

## Not tested (and why)
- **Placing / cancelling real orders, reviews, sign-ups, emails:** would write to the live Neon DB and send real email.
  Recommend a **separate Neon branch** (free) as a test database so these can be tested end-to-end safely — see checklist.
- **Load/stress testing:** would hit the live database.
- **Real phones / Safari:** emulated at 375px in Chromium only; do a final pass on an actual iPhone and Android.

## Re-test after Antigravity's fixes
C1, C3 (P0 items) · checkout promo + VAT rules (M1) · admin settings permissions (C2) · reviews (C4) · cancellation flow end-to-end on a test DB branch.
