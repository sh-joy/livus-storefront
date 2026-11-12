# Round 10: Checkout Fixes and Manual bKash/Nagad Payment Report

**Date:** 12 November 2026  
**Branch:** `claude-first-change`  
**Commit:** `a6616bc`  
**Execution:** Antigravity  
**Review:** Claude  
**Target Environment:** Test Branch (`ep-fancy-feather`, `.env.test`) / Local Dev  

---

## 1. Executive Summary

All three tasks from `docs/HANDOFF_ANTIGRAVITY_ROUND10.md` have been fully implemented, verified, tested, and built without regression:
1. **Task 1: Address Dropdowns (Division first, then District):**
   - Full Bangladesh administrative hierarchy created in `src/lib/bangladesh-geo.ts` with all 8 divisions and strictly all 64 districts (sorted A–Z per division, zero duplicates).
   - Division dropdown first with plain names (no "Division" suffix in list). District dropdown disabled until division is selected, showing "Select a division first", and dynamically filtered to only that division's districts. Changing division clears district.
   - All legacy "State / Region" and "State / Region (District)" wording completely removed across labels, placeholders, and error messages.
   - Formatted canonical order location as `"District, Division"`. Backward compatibility preserved for existing database records.
   - Profile page and Admin Create Order modal updated with the same division & district hierarchy.
2. **Task 2: Payment Methods Stacked Vertically:**
   - Replaced fragile 3-column grid with stacked full-width rows (min-height 56px, clickable): Cash on Delivery, bKash, and Nagad.
   - Each row features a custom radio circle on the left, method title and grey subtitle in the middle, and official payment badge on the right.
   - Active selection receives black border; inactive receive `--lv-line`. Disabled methods (no merchant number configured in Admin) are cleanly greyed out with "Not available right now".
   - The instruction box for bKash/Nagad expands directly under its respective row.
   - Tested responsive layouts across 375px, 768px, and 1440px viewports.
3. **Task 3: Finish Manual bKash / Nagad Payment Flow:**
   - **Storefront (Customer):**
     - Clean Send Money instructions (prominent merchant number with 2-second "Copied" feedback, exact order total in large text with Copy button, 3 numbered steps emphasizing Send Money).
     - Required fields: Transaction ID (8–16 alphanumeric, auto-uppercased, no spaces) and sender mobile number (validated BD mobile with prefix normalization to `01[3-9]XXXXXXXX`).
     - Duplicate TrxID prevention returning `"This Transaction ID has already been used. Please check it and try again."`.
     - Primary button changes to **"Confirm order"** with note `"We'll check your payment and confirm your order by phone."`.
     - Order Confirmed page displays `"Payment status: Payment received for verification"`, TrxID, sender number, and reassurance `"We'll confirm once we've checked it (usually within a few hours)"` (never displays "Paid").
   - **Admin:**
     - Orders list displays informative payment badges (`COD`, `bKash: Awaiting verification`, `bKash: Verified`, `Payment not received`, etc.).
     - Filter tab & quick filter for "Awaiting verification".
     - Order Detail Drawer features a dedicated **Payment** box with Method, Amount Expected, TrxID (with Copy), Sender Number (with Copy and `tel:` call link), and submission timestamp.
     - Action buttons: **"Mark as verified"** (transitions to `Paid (Verified)`, captures audit metadata) and **"Payment not received"** (transitions to `Payment not received` without auto-cancelling the order).
     - Marking an order Delivered does not alter verified wallet payment status.
     - Admin dashboard includes an "Awaiting Verification" metric card with deep-link filter.
4. **Database Safety & Migrations:**
   - Live database was untouched.
   - Created additive SQL script `drizzle/manual/0009_payment_verification.sql` for owner approval.
   - Server actions wrap audit updates in try/catch to maintain full functionality prior to migration execution.

---

## 2. Visual Verification & Screenshots

Screenshots captured locally at exact viewport resolutions and stored in `docs/screens/round10/`:

| Viewport / Component | View | Screenshot Link |
|---|---|---|
| **Desktop (1440x900)** | Checkout with bKash selected & Send Money box expanded | [`docs/screens/round10/checkout-bkash-1440px.png`](file:///Users/shamimhossen/.gemini/antigravity/my-store/docs/screens/round10/checkout-bkash-1440px.png) |
| **Mobile (375x812)** | Checkout with stacked payment methods & bKash Send Money | [`docs/screens/round10/checkout-bkash-375px.png`](file:///Users/shamimhossen/.gemini/antigravity/my-store/docs/screens/round10/checkout-bkash-375px.png) |
| **Desktop (1440x900)** | Division & Filtered District Address Dropdowns | [`docs/screens/round10/checkout-address-dropdowns.png`](file:///Users/shamimhossen/.gemini/antigravity/my-store/docs/screens/round10/checkout-address-dropdowns.png) |
| **Admin Drawer (1440x900)** | Admin Order Detail Payment Box with TrxID, Sender & Actions | [`docs/screens/round10/admin-payment-box.png`](file:///Users/shamimhossen/.gemini/antigravity/my-store/docs/screens/round10/admin-payment-box.png) |

---

## 3. Database Migration for Owner Approval

Additive SQL script placed in `drizzle/manual/0009_payment_verification.sql`:

```sql
-- 0009_payment_verification.sql
-- Add audit columns for manual bKash/Nagad payment verification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at timestamp;
```

> **Note for Owner:** This script is purely additive (nullable columns with `IF NOT EXISTS`). No tables or existing columns are dropped or renamed. The application code safely handles execution whether or not this migration has run.

---

## 4. Test & Build Verification

### 4.1 Unit Tests (`vitest run`)
Added unit test suite `tests/checkout-address-payment.test.ts`:
- Validates 8 divisions and all 64 unique districts sorted A–Z.
- Verifies normalization and contemporary official spellings (`Chattogram`, `Cumilla`, `Barishal`, `Jashore`, `Bogura`).
- Tests `formatLocation` producing canonical `"District, Division"`.
- Tests BD mobile phone validation (accepts `+880`, `880`, `01[3-9]`, enforces 11 digits).
- Tests TrxID format enforcement (8–16 alphanumeric characters).
- Tests payment transition state machine (verify, not received, delivered preservation).

**Result:**
```
 Test Files  7 passed (7)
      Tests  54 passed (54)
   Start at  13:36:57
   Duration  1.29s (transform 731ms, setup 0ms, import 3.31s, tests 225ms, environment 1ms)
```

### 4.2 Type Checking (`npx tsc --noEmit`)
```
Exit code: 0 (No type errors)
```

### 4.3 Production Build (`next build`)
```
▲ Next.js 16.2.12 (Turbopack)
✓ Compiled successfully in 3.9s
✓ Finished TypeScript in 6.8s
✓ Collecting page data using 11 workers in 394ms
✓ Generating static pages using 11 workers (54/54) in 632ms
Finalizing page optimization in 11ms
Exit code: 0 (All 54 routes successfully generated)
```

---

## 5. Summary of Files Changed

- `src/lib/bangladesh-geo.ts`: Created Bangladesh geo hierarchy, division/district map, phone/trx normalizers and validators.
- `drizzle/manual/0009_payment_verification.sql`: Created migration for approval.
- `src/lib/validations.ts`: Removed "State / Region" text, added division/district validation and wallet superRefine rules.
- `src/figma-components/CheckoutPage.tsx`: Division-first address dropdowns, stacked payment rows, nested wallet box under selected row, "Confirm order" CTA.
- `src/app/actions/checkout.ts`: Integrated geo normalizers, duplicate TrxID validation, sender phone storage.
- `src/app/actions/orders.ts`: Canonical `"District, Division"` formatting in orders and confirmed order action.
- `src/imports/OrderConfirmed/index.tsx`: Order confirmed display for manual wallet orders ("Payment received for verification", TrxID, sender number).
- `src/figma-components/ProfilePage.tsx`: Division and District dropdowns; removed "State / Region" text.
- `src/app/actions/admin-actions.ts`: Updated `verifyOrderPaymentAction` (verify & not_received), preserved verified wallet payment on Delivered.
- `src/app/admin/orders/page.tsx`: Added Payment badge column, Awaiting verification filter & metric, Division/District in create order modal, `<Suspense>` wrapper.
- `src/components/OrderDetailsDrawer.tsx`: Payment box with method, amount expected, TrxID copy, sender copy & `tel:` link, "Mark as verified" & "Payment not received" actions.
- `src/app/admin/page.tsx`: Awaiting verification dashboard metric card with direct filter link.
- `tests/checkout-address-payment.test.ts`: Complete unit test coverage for Round 10 requirements.
