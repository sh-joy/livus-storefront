# Handoff to Antigravity — Go-live

The code is finished and tested (commit `2767672` on branch `claude-first-change`). Your job is to take the store live,
following `docs/DEPLOYMENT.md`. Work from the project folder `/Users/shamimhossen/.gemini/antigravity/my-store`.

## Golden rules
1. **Ask the owner before every step that changes something live** (database, Vercel, DNS, OAuth apps) and say exactly what you will change. Wait for "yes".
2. **Never print, log, commit or paste secrets** (passwords, `DATABASE_URL`, API keys). Never commit `.env.local`, `.env` or `.admin-credentials.json`.
3. **Do not change application code** unless a step below fails because of a bug — then stop, describe the bug to the owner, and fix only that after approval. Run `npx tsc --noEmit`, `npm test`, `npm run build` after any code change.
4. Steps that need the owner's own logins (Vercel, Neon, domain registrar, Google Cloud, Meta, Brevo) — guide the owner click-by-click, or use the CLI/browser only if the owner is already signed in and approves.

## Step 1 — Superadmin password (live database)
- Generate a strong random password (≥ 16 chars) and show it to the owner **once**, telling them to save it in a password manager. Or let the owner choose one.
- Run from the project folder:
  `npm run admin:set-password -- superadmin@livus.com '<password>' "Super Admin" superadmin`
- Expected output: `Updated superadmin superadmin@livus.com: password set (existing sessions revoked).`
- Ask the owner whether to also set a password for `admin@livus.com` and whether to **delete** the unused `test6@livus.com` admin (Admin → Settings, signed in as superadmin).

## Step 2 — Rotate the Neon database password (owner's Neon account)
- Neon console → project → Roles → reset password for the database role. The old password is in git history, so this is required.
- Update `DATABASE_URL` in `.env.local` (local) and later in Vercel. Re-run Step 1's sign-in check after rotating.

## Step 3 — Store data (live database, via Admin panel preferred)
Ask the owner before each change:
- Admin → Settings: real **bKash** and **Nagad** merchant numbers, real **support phone** and **support email** (bKash/Nagad stay hidden at checkout until valid numbers are set).
- Admin → Products:
  - **Silver Cufflinks, Red Silk Tie, Black Leather Belt**: sizes should be a single "One Size" (currently XS–XXL), and their photos currently show people wearing clothes — ask the owner for correct photos and upload them (uploads need the Vercel Blob store from Step 4 when done on the live site).
  - Most product photos load from `cdn.gentlepark.com` (another brand). Ask the owner for LIVUS photos and replace them product by product.
- Admin → Orders: list the test orders (e.g. LIV-33333, LIV-63185, LIV-53039 and any created during testing) and delete only the ones the owner confirms are tests.
- Admin → Discount codes: review GIFT2000 (৳2,000 off) and SAVE500 — ask whether to keep, limit or disable.

## Step 4 — Deploy on Vercel (owner's Vercel account)
Follow `docs/DEPLOYMENT.md` sections (b) and (e):
- Upgrade to Vercel Pro (commercial store) and Neon Launch plan; set spending limits/alerts.
- Create & connect a **Blob** store (Storage → Create → Blob) so admin photo uploads work.
- Set every environment variable from the table in DEPLOYMENT.md for **Production** and **Preview**. Generate a new `BETTER_AUTH_SECRET` (`openssl rand -base64 32`); do not reuse the local one.
- Deploy branch `claude-first-change` as a Preview first. On the preview: open the site, sign in to `/admin/sign-in`, place one Cash on Delivery order with the owner's phone, confirm it in Admin → Orders, then cancel/delete it.
- When the owner approves: merge `claude-first-change` into `main` (open a PR, owner reviews) and let Vercel deploy production.

## Step 5 — Domain (owner's registrar / Cloudflare)
DEPLOYMENT.md section (f):
- Vercel → Domains → add the domain; create the DNS records Vercel shows (Cloudflare: DNS only / grey cloud).
- Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://<domain>` and redeploy.
- Google Cloud Console and Meta for Developers: add `https://<domain>/api/auth/callback/google` and `/facebook` as redirect URIs.
- Brevo: verify the sending domain (SPF, DKIM, DMARC). Meta Business: domain verification. Google Search Console: add the domain, submit `https://<domain>/sitemap.xml`.

## Step 6 — Final live check (with the owner, on a real phone)
Home → product → add to cart → checkout (Cash on Delivery) → confirmation email arrives → order appears in Admin → mark Delivered.
Also: sign up with a new email (code arrives), password reset, Google and Facebook sign-in, upload one product photo in Admin.
Report every step as pass/fail with what you saw.

## Not yours to change (owner decides later)
Footer social links and the About / Contact / Privacy / Terms / Shipping & Returns page text.

## Final report to the owner
For each step: done / waiting on owner / failed (with the exact error). List anything the owner still has to do.
