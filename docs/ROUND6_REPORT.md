# Round 6: Production Readiness Report

**Date:** 11 November 2026  
**Branch:** `claude-first-change` (ahead of origin by 13 commits, clean working tree)  
**Neon Test Endpoint:** `ep-fancy-feather-azpu1g00-pooler.c-3.ap-southeast-1.aws.neon.tech` (Branch `round6-test`)  
**Production Live DB:** `ep-wild-paper` (Untouched, awaiting owner approval)

---

## 1. Agent Execution Summary

### Agent D1: Database & Secrets (Ops)

| Task | Status | Evidence / Notes |
|---|---|---|
| **D1.1** Neon test branch migrations (`0006_promo_popup.sql` & `0007_site_profile.sql`) | **Done** | Executed twice sequentially on `round6-test` (`ep-fancy-feather`). Idempotency verified: `promo_popup` (1 row), `site_content` (1 row: `site_profile`), `contact_messages` (table + index created). 0 errors. |
| **D1.2** Admin save & reload verification | **Done** | Local dev server running isolated on `.env.test`. Verified 200 OK on `/admin/site`, `/admin/content`, `/admin/popup`, `/admin/messages`, `/admin/settings`. Programmatic and HTTP save & reload verified in database. |
| **D1.3** Run migrations 0006 & 0007 on Neon `main` | **Waiting on owner** | Requires explicit owner approval before touching Neon production `main`. |
| **D1.4** Rotate Neon DB password & update Vercel | **Waiting on owner** | Requires explicit owner approval before rotating credentials and updating Vercel env vars. |
| **D1.5** Confirm Vercel production env vars | **Waiting on owner** | Owner checklist prepared for Vercel project settings (see Section 3). |
| **D1.6** Delete `round6-test` branch | **Waiting on owner** | Keep active until owner approves promotion to `main`. |

---

### Agent E: End-to-End Order Flow QA (on Neon Test Branch)

| QA Test Case | Status | Evidence / Results |
|---|---|---|
| **E.1** Guest checkout (COD) | **Done** | Placed order with size selection, 10% VAT, correct shipping (৳150 or ৳0 free shipping threshold). Order created with status `Pending`, total verified in DB, order confirmed page details valid. |
| **E.2** bKash & Nagad checkout | **Done** | Verified TrxID requirement (8–16 alphanumeric). Saved as `bKash (Manual)` and `Nagad (Manual)` with `Awaiting Verification`. Duplicate TrxID correctly rejected by DB query check. |
| **E.3** Promo codes | **Done** | Tested all 4 cases: `QA_VALID` applied 15% discount; `QA_EXPIRED` blocked with "This promo code has expired"; `QA_MINCART` blocked with minimum cart message; `QA_LIMIT` blocked after maximum 1 order reached. |
| **E.4** Stock reservation & sold-out | **Done** | Atomic decrement tested on single-unit stock row: purchasing last unit sets `quantity = 0` and `is_stock_out = true`. Subsequent checkout attempts returned 0 rows and were blocked with out-of-stock notification. |
| **E.5** Signed-in checkout & `/profile` | **Done** | Customer profile linked; order history query matches customer email/phone and displays orders on `/profile`. |
| **E.6** Admin order status handling | **Done** | Status transitions tested: `Pending` → `Confirmed` → `Shipped` → `Delivered`. |
| **E.7** Contact form | **Done** | Submitted message saved to `contact_messages` with topic and status `New`. Displayed and status updated to `Replied`. |
| **E.8** Newsletter subscription | **Done** | Email saved to `newsletter_subscribers` via newsletter action. |
| **E.9** Concurrency & duplicate prevention | **Done** | Duplicate payment TrxID and concurrent double-submits blocked. |
| **E.10** `src/app/global-error.tsx` | **Done** | Created in commit `c57954c`. Matches `error.tsx` styling, contains `<html>`/`<body>`, no stack traces exposed. |
| **E.11** Bug fixes | **Done** | All schema alignment issues in tests fixed (see Section 2). |
| **E.12** Test data cleanup | **Done** | 100% of test orders, order items, promo codes, customers, contact messages, and test subscribers deleted from `round6-test`. Confirmed remaining test count = 0. |

---

### Agent F: Owner Content & Catalog Readiness

| Task | Status | Evidence / Notes |
|---|---|---|
| **F.1** Checklist for owner in `/admin/site` | **Done** | Complete checklist prepared with exact field specifications (see Section 3). |
| **F.2** Catalog cleanup plan | **Done** | All 14 products mapped: 100% currently use `gentlepark.com` placeholder images (94 gallery images + 15 variant thumbnails = 109 URLs). Full table provided below. |
| **F.3** Blob image upload in Product edit | **Waiting on owner** | Code supports Vercel Blob via `@vercel/blob` when `BLOB_READ_WRITE_TOKEN` is set. Local fallback saves to `public/uploads/products`. Production Blob store must be connected by owner in Vercel. |
| **F.4** Category checks & friendly empty states | **Done** | Verified `/for-him`, `/for-her`, `/unisex`, `/accessories`. When empty or when no products match filters, friendly empty state ("No products found") renders instead of a blank grid. |
| **F.5** Admin content page wiring | **Done** | All 10 keys in `SITE_CONTENT_KEYS` (`privacy_page`, `terms_page`, `shipping_page`, `cookies_page`, `about_page`, `contact_intro`, `contact_faqs`, `home_collection_text`, `newsletter_cta`, `shipping_returns`) are verified wired to live storefront routes and trigger `revalidatePath` on save. |

---

## 2. Catalog Cleanup Plan (GentlePark Placeholder Data)

All 14 products currently in the database use `gentlepark.com` placeholder images. **No products have been deleted.** The owner should decide which items to replace with real LIVUS inventory and photos.

| Category | Product Name | Slug | Gallery Images | GentlePark Images | Variant Thumbnails |
|---|---|---|---|---|---|
| **Accessories** | Black Leather Belt | `black-leather-belt` | 7 | 7 | 1 |
| **Accessories** | Red Silk Tie | `red-silk-tie` | 7 | 7 | 1 |
| **Accessories** | Silver Cufflinks | `silver-cufflinks` | 7 | 7 | 1 |
| **For Her** | Beige Tailored Trousers | `beige-tailored-trousers` | 7 | 7 | 1 |
| **For Her** | Floral Summer Dress | `floral-summer-dress` | 8 | 8 | 1 |
| **For Her** | Grey Textured Crepe Two Piece | `grey-textured-crepe-two-piece` | 3 | 3 | 1 |
| **For Her** | Olive Green Cargo Pants | `olive-green-cargo-pants` | 6 | 6 | 1 |
| **For Her** | Striped Cotton Shirt | `striped-cotton-shirt` | 8 | 8 | 1 |
| **For Him** | Lavender Stripe Slim Fit Shirt | `lavender-stripe-slim-fit-shirt` | 6 | 6 | 1 |
| **For Him** | Navy Blue Chino Pants | `navy-blue-chino-pants` | 6 | 6 | 1 |
| **For Him** | Navy Blue Two Piece Suit | `navy-blue-two-piece-suit` | 7 | 7 | 1 |
| **For Him** | Off-White Textured Crewneck T-Shirt Half | `off-white-textured-crewneck-t-shirt-half` | 8 | 8 | 2 |
| **For Him** | White Linen Shirt | `white-linen-shirt` | 7 | 7 | 1 |
| **Unisex** | Graphic Print T-Shirt | `graphic-print-t-shirt` | 7 | 7 | 1 |
| **TOTAL** | **14 products** | | **94** | **94 (100%)** | **15 (100%)** |

---

## 3. Owner Action Checklist (Required Before Launch)

Follow these steps in order:

### 1. Approve Live Neon Migration (Agent D1.3)
Run `drizzle/manual/0006_promo_popup.sql` and `0007_site_profile.sql` on Neon `main`.  
*(Both migrations are additive and verified safe to run).*

### 2. Rotate Neon Database Password (Agent D1.4)
1. Go to Neon Console → Project Settings → Roles → Reset password for `neondb_owner`.
2. Update `DATABASE_URL` in Vercel project settings (Production + Preview environments).
3. Update local `.env.local`.

### 3. Connect Vercel Blob Store (Agent F.3)
1. Go to Vercel Console → Project `my-store` → Storage → Create Database → **Blob**.
2. Connect to `my-store` (Production and Preview). This sets `BLOB_READ_WRITE_TOKEN`.
3. Test uploading a real product image in `/admin/products`.

### 4. Verify Vercel Production Environment Variables (Agent D1.5)
Ensure the following variable names exist in Vercel Production:
- `DATABASE_URL` (new pooled connection string with rotated password)
- `BETTER_AUTH_SECRET` (strong secret)
- `BETTER_AUTH_URL` (`https://mylivus.vercel.app` or custom domain)
- `NEXT_PUBLIC_APP_URL` (`https://mylivus.vercel.app` or custom domain, **not** localhost)
- `BLOB_READ_WRITE_TOKEN` (from Vercel Blob)
- `BREVO_API_KEY`, `BREVO_SMTP_KEY`, `BREVO_SENDER_EMAIL` (for transactional emails)
- `VAT_PERCENT` (`10`)
- `DELIVERY_CHARGE_BDT` (`150`)

### 5. Configure Brand & Payment Settings in Admin
1. **`/admin/site`**:
   - Upload Logo (Light and Dark) & Favicon
   - Set Support Phone & WhatsApp number (e.g. `017XXXXXXXX`)
   - Set Support Email & Business Address
   - Add Facebook / Instagram / TikTok links
2. **`/admin/settings`**:
   - Enter active bKash Merchant Number (e.g. `01XXXXXXXXX`)
   - Enter active Nagad Merchant Number (e.g. `01XXXXXXXXX`)
   *(bKash and Nagad checkout will remain disabled until valid numbers are entered).*

### 6. Replace Catalog Placeholder Products (Agent F.2)
Replace placeholder GentlePark products in `/admin/products` with real LIVUS athletic wear and jerseys.

---

## 4. Verification & Build Status

- **Type Check (`npx tsc --noEmit`)**:
  ```
  ✓ Clean (0 errors)
  ```
- **Test Suite (`npm test`)**:
  ```
  ✓ tests/site-profile.test.ts (6 tests)
  ✓ tests/order-pricing.test.ts (11 tests)
  ✓ tests/seo.test.ts (3 tests)
  ✓ tests/site-content.test.ts (3 tests)
  Test Files: 4 passed (4)
  Tests:      23 passed (23)
  ```
- **Production Build (`npm run build`)**:
  ```
  ▲ Next.js 16.2.12 (Turbopack)
  ✓ Compiled successfully in 3.8s
  ✓ Finished TypeScript in 6.5s
  ✓ Generating static pages using 11 workers (54/54) in 2.7s
  ```

---

## 5. Commit Hashes (Branch: `claude-first-change`)

- `c57954c` - `feat: add global-error.tsx with matching error style and no stack traces`
- `2719057` - `feat: complete Round 5 uncommitted work (policy Last updated line, RichText headings, hide scrollbars, policy text without offers)`
- `9e9bf69` - `style(homepage): place collection description beneath title and hide product count`
- `fc1c115` - `Policies: remove free-delivery offer from policy text; guide rule 9.5`
- `10ee0bb` - `feat(content): separate defaults to site-content-defaults, add site content tests, and wire cookie policy`
- `b57243f` - `docs: add Round 5 completion report`
