# LIVUS — SQA Report

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
