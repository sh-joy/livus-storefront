# Round 6: Production readiness (Antigravity)

**Branch:** `claude-first-change` (never push to `main`; Claude tests and releases).
**Goal:** the store can take real orders from real customers safely. **Speed optimization and SEO tuning are NOT in this round.** They come last, after the owner signs off.

---

## 0. Claude's review of Round 5 (11 Nov 2026)

Verified on an isolated production build:

| Check | Result |
|---|---|
| Type check (`tsc --noEmit`) | ✅ clean |
| Tests | ✅ 23/23 (one stale test fixed by Claude: it still expected `৳2,500` free-delivery text in the shipping policy) |
| Production build | ✅ passes |
| All storefront, policy and cookies pages | ✅ 200 |
| `/variants`, `/design-system` | ✅ 404 |
| `/admin/*` without login | ✅ redirects to sign-in |
| robots.txt / sitemap.xml / OG image | ✅ correct; admin, checkout and account routes are disallowed |
| Offer text in policy, FAQ and contact pages | ✅ none |
| Admin server actions and `/api/upload` | ✅ all writes check admin; public reads stay public |
| Rate limits on checkout, contact, newsletter, auth | ✅ present |

**Open problems found:**
1. **119 product images on the homepage still load from `cdn.gentlepark.com`.** The catalog (silk tie, cufflinks, floral dress…) is placeholder data, not LIVUS products. We cannot launch with it.
2. Migrations **0006 and 0007 are not run on Neon.** Until they are, `/admin/site`, `/admin/content`, `/admin/popup`, `/admin/messages` and the product-page text editor cannot save.
3. Neon password rotation is still waiting.
4. Real support phone, bKash/Nagad numbers and address are not entered yet.
5. Your uncommitted work (policy-page "Last updated" line, RichText headings, homepage "Explore" header, `hideProductCount`) is unreviewed. Finish it, commit it, and list it in your report.

---

## 1. Golden rules (unchanged from Round 5, still binding)

- Never print or commit secrets (`.env*`, `.admin-credentials.json`, tokens, DB URLs).
- **Ask the owner before any live change:** Vercel env vars, Neon `main` branch, DNS, OAuth, deleting data.
- Database changes: run them on a **Neon branch first**, verify, then ask the owner before running them on `main`.
- **Never write offers into page or policy text.** No free delivery, no discounts, no "% off". Offers only live in the popup, the marquee and the cart progress bar, which the admin turns on and off.
- New settings go in `site_content` (key/value), **never** as new `store_settings` columns.
- `'use server'` files export only async functions.
- **No visible scrollbars on the storefront.** `globals.css` hides them everywhere outside `.admin-portal`. Never add custom `::-webkit-scrollbar` styles or visible scrollbars to storefront components.
- Before every commit: `npx tsc --noEmit` and `npm test` must be green, and `npm run build` must pass.
- Commit only your own files with explicit `git add <paths>`. Never `git add -A`.

---

## 2. Agents and file ownership

Run these in order: **D1 first**, because everything else needs the tables. After that, **E and F can run in parallel**.

### Agent D1: Database and secrets (ops, needs owner approval)
1. Create a Neon branch `round6-test` from `main`. Run `drizzle/manual/0006_promo_popup.sql`, then `0007_site_profile.sql`. Confirm both are re-runnable (run each twice: no errors, no duplicate rows).
2. Point a local `.env.local` at the branch and verify that each admin page saves and reloads: `/admin/site`, `/admin/content`, `/admin/popup`, `/admin/messages`, and the product-page text editor in Settings.
3. **Stop and ask the owner**, then run both migrations on Neon `main`.
4. **Ask the owner**, then rotate the Neon DB password. Update `DATABASE_URL` in Vercel (Production + Preview) and redeploy. Confirm the live site still loads products.
5. Confirm these Vercel production env vars exist (names only, never values): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` (must be the real site URL, **not** localhost), `BLOB_READ_WRITE_TOKEN`, Brevo/email keys, `VAT_PERCENT`, `DELIVERY_CHARGE_BDT`.
6. Delete the `round6-test` branch when done.

### Agent E: End-to-end order flow QA (code fixes allowed)
Use the Neon test branch, never `main`. Test on desktop and a 375px phone viewport:
1. **Guest checkout:** add to bag, choose a size, checkout, pay COD, open the order-confirmed page. Check that the order appears in admin with the correct total, delivery charge and VAT.
2. **bKash and Nagad checkout:** the transaction-ID field is required, and the order is saved with the method and transaction ID.
3. **Promo code:** valid, expired, below the minimum, and over the usage limit, each with a clear message. The total recalculates correctly.
4. **Stock:** ordering the last unit sets the product to sold out. Ordering more than the available stock is blocked with a clear message.
5. **Signed-in checkout:** sign up, verify email, sign in, place an order. It shows in `/profile`.
6. **Admin order handling:** change the status through Confirmed, Shipped and Delivered. The customer email is sent, if Brevo is configured.
7. **Contact form:** the message appears in `/admin/messages`.
8. **Newsletter:** sign up from the footer and from the popup. Both appear in Subscribers.
9. **Error states:** turn off network mid-checkout and submit twice quickly. That must create no duplicate orders and show a clear error.
10. Add `src/app/global-error.tsx`. It must use the same style as `error.tsx` and have no stack traces.
11. Fix every bug you find. Write each one into the report: what happened, the fix, and the file.
12. **Delete every test order, customer and subscriber** you created on the test branch. Nothing from testing may reach `main`.

### Agent F: Owner content and catalog readiness (admin UI only, no code unless broken)
1. Prepare a checklist for the owner of what to enter in `/admin/site`: logo (light and dark), favicon, support phone, WhatsApp, email, address, Facebook/Instagram/TikTok links, and bKash/Nagad merchant numbers.
2. **Catalog cleanup plan:** list every product that is placeholder data, or that uses a `gentlepark.com` image, in a table with name, slug and image count. **Do not delete anything.** The owner decides which to archive and which to replace.
3. Confirm the image upload in Product edit works end to end with Blob: upload, save, then check the image shows on the product page with a `*.blob.vercel-storage.com` URL.
4. Check categories: For Him, For Her, Unisex and Accessories each show the right products. Empty categories must show a friendly empty state, not a blank grid.
5. Check that every text block in `/admin/content` actually changes the live page after saving. List any that don't.

---

## 3. Out of scope this round (do NOT do)

- Speed or bundle optimization, image CDN tuning, Lighthouse work.
- SEO copy rewriting, keyword work, new structured data.
- Design changes that the owner did not request.
- Pushing to `main`, or any DNS or custom-domain change.

---

## 4. Final report and stop

Write `docs/ROUND6_REPORT.md` with:
1. A table for each agent: task, status (Done / Waiting on owner / Blocked), and evidence (page, screenshot path, or SQL row count).
2. Every bug found and fixed, with files.
3. Every **owner action still needed**, as a numbered checklist the owner can follow.
4. Final `tsc`, test and build output (summary lines only).
5. Commit hashes.

Then **stop**. Claude will retest everything and release to `main`. After that, the last round is optimization and SEO.

---

## 5. Paste-ready prompt

> Read `docs/HANDOFF_ANTIGRAVITY_ROUND6.md` fully and follow it. First finish and commit your uncommitted Round 5 work (policy "Last updated" line, RichText headings, homepage "Explore" header, `hideProductCount`). Then run Agent D1 (database and secrets): stop and ask me before touching Neon `main` or Vercel env vars. After D1, run Agents E (order-flow QA on the Neon test branch) and F (owner content and catalog checklist) in parallel. Golden rules: no secrets in output, no offers in page or policy text, never push to `main`, test data must never reach the live database. Finish by writing `docs/ROUND6_REPORT.md`, then stop. No optimization or SEO work this round.
