# LIVUS — Go-Live Checklist (non-code)

Tick these before running paid marketing. **Step-by-step setup (hosting, env vars, database, domain, OAuth, email) is in [`DEPLOYMENT.md`](./DEPLOYMENT.md)** — follow it first. Code fixes are in `FIX_PLAN_FOR_ANTIGRAVITY.md`; bugs in `SQA_REPORT.md`.

## 1. Security & accounts (do first)
- [ ] **Rotate the Neon database password** (the old one is in git history). Update `DATABASE_URL` locally and in Vercel.
- [ ] **Change all admin passwords** (superadmin, manager, test6, admin@livus.com) with `npm run admin:set-password` (see DEPLOYMENT.md §d). Delete accounts you don't use (e.g. test6).
- [ ] Set a strong random `BETTER_AUTH_SECRET` in Vercel (e.g. `openssl rand -base64 32`). Don't reuse the local one.
- [ ] Turn on 2-factor login for your Vercel, Neon, GitHub, Brevo and domain-registrar accounts.

## 2. Hosting plans (avoid mid-campaign limits)
- [ ] **Vercel Pro** (commercial use) — set a spend limit and usage alerts.
- [ ] **Neon Launch** plan — set a spending limit and alerts; free plan pauses the DB when compute runs out.
- [ ] **Vercel Blob** store created and connected (Storage → Create → Blob) so admin photo uploads work.
- [ ] **Brevo** — check the daily email cap fits sign-ups + order emails during campaigns; upgrade if needed.
- [ ] Verify your sending domain in Brevo (SPF, DKIM, DMARC records) so order emails don't land in spam.

## 3. Environment variables in Vercel (Production)
- [ ] All variables set as listed in **DEPLOYMENT.md §b**. The site now checks them at startup and refuses to start (with a clear message in the Vercel logs) if `DATABASE_URL`, `BETTER_AUTH_SECRET` or the https site URL are missing.
- [ ] Real domain added to each Google/Facebook OAuth app's redirect URLs (DEPLOYMENT.md §f).

## 4. Domain
- [ ] Connect your domain to Vercel (Cloudflare DNS optional, free) — DEPLOYMENT.md §f.
- [ ] HTTPS working on `https://yourdomain` and `www` redirects to one version.
- [ ] Update the hard-coded `livus.com.bd` links in emails if that isn't your domain.

## 5. Store data (Admin)
- [ ] **Real bKash and Nagad merchant numbers** in Admin → Settings (until then, disable those options).
- [ ] Real support phone and email.
- [ ] Decide VAT: is 10% correct, and should it apply after discounts?
- [ ] Delivery fees per division and the free-delivery threshold.
- [ ] Review promo codes: GIFT2000 (৳2,000 off, no minimum, unlimited uses) and SAVE500 are live — disable or add limits.
- [ ] Replace the product photos hot-linked from `cdn.gentlepark.com` with your own photos.
- [ ] Fix categories: the Accessories category is created by `drizzle/manual/0005_accessories_category.sql` (run it if `/accessories` is empty — DEPLOYMENT.md §c); check each product is in the right For Him / For Her / Unisex section.
- [ ] Delete test orders (LIV-33333, LIV-63185, LIV-53039) and test customers before launch so reports start clean.

## 6. Legal & trust pages
- [ ] Privacy Policy (mention checkout autosave, cookies, tracking pixels)
- [ ] Terms & Conditions
- [ ] Shipping, Returns & Refund Policy (bKash/Nagad refunds, cancellation rules)
- [ ] About and Contact pages; real Facebook/Instagram links in the footer
- [ ] Trade licence / business info if you'll apply for a payment gateway (SSLCommerz, bKash PGW) later

## 7. Marketing readiness
- [ ] Meta Pixel + Conversions events (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase) tested with Meta Pixel Helper
- [ ] Google Analytics 4 + Google Search Console (submit `sitemap.xml`)
- [ ] Facebook domain verification (Business Manager → Brand Safety → Domains)
- [ ] Share preview: paste a product link into Facebook/WhatsApp and check image + title look right
- [ ] Ad landing pages load fast on mobile data (compress big images first)

## 8. Operations
- [ ] Decide who checks bKash/Nagad TrxIDs and how often; who updates order status; courier booking process
- [ ] Neon: confirm point-in-time restore window on your plan; do one test restore to a branch
- [ ] Create a **Neon test branch** + a Vercel Preview environment that uses it, so new features can be tested with real orders without touching live data
- [ ] Final manual test on a real iPhone and Android: browse → add to cart → checkout (COD) → order email → admin sees it → mark Delivered
