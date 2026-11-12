# Round 10: Checkout fixes and manual bKash/Nagad payment (Antigravity executes, Claude reviews)

**Branch:** `claude-first-change`. **Never push to `main`.** Claude reviews and releases.

**Golden rules (unchanged):**
- no secrets in output; never `git add -A`;
- tsc, tests and build green before each commit;
- no offers in page text; no visible storefront scrollbars;
- no focus rings on the storefront (removed on purpose);
- headings use our type classes;
- **do not touch the live database.** Any SQL goes in a new additive file `drizzle/manual/0009_*.sql`, and the owner approves it before it runs.

Main file: `src/figma-components/CheckoutPage.tsx`. Server: `src/app/actions/checkout.ts`. Admin: `src/app/admin/orders/page.tsx` and `src/app/actions/admin-actions.ts`.

---

## Task 1: Address: Division, then District

**Today:** the first dropdown says "State / Region (District)" but lists divisions. The second says "Select State / Region first". Customers are confused.

**Change to:**
1. **First dropdown, "Division *":** lists the 8 divisions by plain name (Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, Mymensingh). Don't add "Division" after each name in the list.
2. **Second dropdown, "District *":** disabled until a division is chosen, with the placeholder "Select a division first". Once a division is chosen, it lists **only that division's districts**, sorted A–Z. Changing the division clears the district.
3. **Check the data map** at the top of `CheckoutPage.tsx` (around line 69). It must contain all **64 districts** under the correct divisions. Fix any that are missing or misplaced. Use the official spellings (e.g. Chattogram, Cumilla, Barishal, Jashore, Bogura); old spellings may stay as search aliases if needed.
4. **Error messages:** "Please choose your division" and "Please choose your district". Remove every "State / Region" wording from checkout, including errors, placeholders and the saved address label.
5. **ZIP / Post code** stays optional, with no asterisk.
6. **Saved order:** store `division` and `district` in the order address. Use the existing fields if they fit; otherwise map region = division, city = district. The admin order view, the order-confirmed page and the customer's profile must show **"District, Division"**. Check that old orders still display.
7. **Signed-in customers** who have a saved address get both dropdowns prefilled.

## Task 2: Payment methods stacked vertically

**Today:** the payment options sit in a 3-column row (`grid sm:grid-cols-3`, around line 650) and break on smaller screens.

**Change to:**
- **One option per row, full width,** stacked: Cash on Delivery, bKash, Nagad.
- **Each row shows:**
  - a radio circle on the left;
  - the method name;
  - one short grey line under the name: "Pay when your parcel arrives" / "Send Money, then enter the Transaction ID";
  - the method's logo on the right, if we have the icons in `public/payment-icons`.
- **Selected row:** black border. Others: `--lv-line` border. The whole row is clickable, with 56px+ height.
- **Disabled method** (no number set in admin): greyed out, with the small note "Not available right now". No admin wording on the storefront.
- **The bKash/Nagad instruction box** (Task 3) opens **directly under its own row**, not below all three.
- **Check the layout at 375px, 768px and 1440px** with nothing breaking. Take screenshots.

## Task 3: Manual bKash / Nagad payment ("Send Money" to our number)

For now there is **no payment gateway**. The customer sends money with **Send Money** to **our own bKash/Nagad number** (the numbers saved in Admin → Settings), then gives us the proof at checkout. A real gateway comes later, once business registration is done. **Build nothing gateway-related now, and never send anything anywhere except our own number.**

Most of this already exists, so **finish and polish it; don't rebuild it.**

### Checkout (customer)
1. When bKash or Nagad is selected, show the box under that row with:
   - "Send Money to our bKash number", the number in large digits, and a **Copy** button that shows "Copied" for 2 seconds;
   - **the exact amount to send** = the order total, in large text, with its own Copy button.
   - **Steps:**
     1. Open bKash (or dial *247#) and choose **Send Money**, not Payment.
     2. Send **৳X** to the number above.
     3. Enter the Transaction ID and the number you sent from below.
2. **Two required fields:**
   - **Transaction ID (TrxID) \*:** 8–16 letters/numbers, auto uppercase, no spaces. The existing check stays.
   - **Your bKash/Nagad number \*:** the number the money was sent from. Validate BD mobile `01[3-9]XXXXXXXX`, and accept +880/880 prefixes, normalised to `01…`. Save it to `paymentSenderPhone`; the column already exists.
3. **Duplicate TrxID:** the existing check stays, with the message "This Transaction ID has already been used. Please check it and try again."
4. The place-order button says **"Confirm order"** for wallet payments. Under it, small grey text: "We'll check your payment and confirm your order by phone."
5. **Order-confirmed page:** for wallet orders, show "Payment received for verification" plus the TrxID and sender number, with the note "We'll confirm once we've checked it (usually within a few hours)." Never say "Paid" here.

### Admin (us)
1. **Orders list:**
   - a payment badge on every order: `COD` / `bKash: Awaiting verification` / `bKash: Verified` / `Payment not received` (the same for Nagad);
   - a filter for "Awaiting verification".
2. **Order detail:** a **Payment** box showing method, amount expected, **TrxID** (with copy), **sender number** (with copy and a `tel:` link), and the time it was submitted. Two buttons:
   - **Mark as verified:** payment status becomes `Paid (Verified)`, with who verified it and when;
   - **Payment not received:** status becomes `Payment not received`. The order stays and is not cancelled automatically. Admin can then call the customer, or cancel it.

   Both buttons need `requireAdmin()` and must revalidate `/admin/orders`.
3. **Delivered order:** marking a verified wallet order Delivered must not change its payment status back. Check the existing logic around `admin-actions.ts:710`.
4. **Dashboard:** show the count of wallet orders awaiting verification.

### Data
- Use the existing columns `paymentMethod`, `paymentStatus`, `paymentTrxId`, `paymentSenderPhone`. If you need "verified by/at", add **only** nullable columns in `drizzle/manual/0009_payment_verification.sql` (`ADD COLUMN IF NOT EXISTS`). **Stop and tell the owner; do not run it on live.** The code must keep working if the column doesn't exist yet: wrap it in try/catch, the same as `site_content`.

### Tests
Add unit tests for:
- the division→district map: 8 divisions, 64 districts, no duplicates;
- sender phone validation and normalisation;
- TrxID validation;
- the payment status transitions (verify / not received / delivered keeps "verified").

---

## Report and stop
Write `docs/ROUND10_REPORT.md` with:
- what changed per task, with commit hashes;
- screenshots under `docs/screens/round10/` of:
  - checkout at 375px and 1440px with bKash selected;
  - the address dropdowns;
  - the admin order Payment box;
- test and build output;
- any SQL file the owner must approve.

Test on `.env.test` or locally, and **never place orders on the live database.** **Stop.** Do not push.

---

## Paste-ready prompt

> Read `docs/HANDOFF_ANTIGRAVITY_ROUND10.md` fully and do all 3 tasks:
> 1. Checkout address: Division first, then District filtered by division, all 64 districts, no "State / Region (District)" wording anywhere.
> 2. Payment methods stacked vertically, one full-width row each, with the wallet box opening under its own row.
> 3. Finish the manual bKash/Nagad flow. The customer sends money with Send Money to OUR number from Admin → Settings, then enters the TrxID and their sender number (both required). Admin sees a Payment box with TrxID and sender number, plus "Mark as verified" and "Payment not received" buttons.
>
> No payment gateway yet. Most of the wallet flow already exists, so finish it; don't rebuild it. Don't touch the live database; put any SQL in `0009_*.sql` for my approval. No focus rings, no offers in text. tsc, tests and build green, commit, write `docs/ROUND10_REPORT.md` with screenshots, and stop. Don't push to main.
