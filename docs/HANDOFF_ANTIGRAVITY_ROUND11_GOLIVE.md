# Round 11: Go-live (domain, security, email, launch checks). Antigravity executes, Claude reviews

The code is live on https://mylivus.vercel.app (branch `main`). This round turns it into a real, launch-ready store. **Most steps change live systems, so every step marked 🔒 needs the owner's "yes" in chat first.** Never print secrets. Never `git add -A`. Code changes go on `claude-first-change`, and Claude pushes to `main`.

Work in this order. Each step has a **check**; don't start the next step until the check passes.

---

## 0. Ask the owner first (one message, all at once)
Collect these before starting:
1. **Domain:** which domain? Does the owner already own it, and where is it registered (e.g. a .com.bd reseller, Namecheap, Cloudflare)? Will the shop be on the bare domain (`livus.com.bd`) or `www.`? **Recommendation:** the bare domain as primary, with `www` redirecting to it.
2. **Support email** on the new domain (e.g. `support@<domain>`), and who reads it.
3. **Real details** for `/admin/site` and `/admin/settings`: logo, favicon, phone, WhatsApp, address, social links, **real bKash and Nagad numbers**. The current bKash number `01711000000` is a sample.
4. **Real products and photos.** If they're not ready yet, launch waits. Say so.

## 1. Security clean-up 🔒
1. **Rotate the Neon database password** (project `muddy-block-03303704`, branch `production`, role `neondb_owner`). The current one was exposed during development.
   - Update `DATABASE_URL` in Vercel for **Production and Preview**, and in local `.env.local`, then redeploy.
   - **Check:** the live site loads products; local dev loads products.
2. Remind the owner to **revoke the Neon API key** created in Round 6 (Neon → Account → API keys).
3. **Admin accounts:** the owner sets new strong, unique passwords for `superadmin@…` and `admin@…`. The owner types them; never the agent. Delete `.admin-credentials.json` locally if it still holds old passwords.
4. **Test branch:** delete the Neon branch `round6-test` and the local `.env.test`.
5. **Database update `0009_payment_verification.sql`** (2 empty columns for "verified by / when") 🔒. Run it once on production. **Check:** the columns exist; product, order and customer counts are unchanged.

## 2. Domain 🔒
1. Vercel → project → **Settings → Domains**: add `<domain>` and `www.<domain>`, set the bare domain as primary, and redirect `www` → bare domain.
2. Add the DNS records **exactly as Vercel shows them** at the owner's registrar: usually an `A` record for the bare domain and a `CNAME` for `www`. If the owner must click this themselves, give them the exact record table.
3. Wait for Vercel to show **Valid configuration** and an SSL certificate.
4. Add a redirect so `mylivus.vercel.app` → `https://<domain>`, using Vercel's redirect option on the domain or a `next.config` redirect for that host.
5. Update the Vercel Production env vars to `https://<domain>`: `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`. Add the domain to Better Auth `trustedOrigins` if the code uses it. Redeploy.
6. **Check:**
   - `https://<domain>` and `https://www.<domain>` load the shop over HTTPS, with `www` redirecting;
   - `/sitemap.xml`, `/robots.txt`, canonical tags and OG URLs all use the new domain;
   - sign-in and sign-out work on the new domain.

## 3. Sign-in providers 🔒
- Google and Facebook OAuth: add `https://<domain>/api/auth/callback/google` (and `/facebook`) as authorised redirect URIs, and add the domain as an authorised origin. Keep the old vercel.app URIs until the move is confirmed.
- **Check:** "Continue with Google/Facebook" works on the new domain. If the owner hasn't set up these apps, hide the buttons rather than show broken ones.

## 4. Email (Brevo) 🔒
1. In Brevo, add and **authenticate the domain**: add the SPF, DKIM and DMARC DNS records Brevo shows. Start with DMARC `p=none`.
2. Set the sender to `support@<domain>` (or the owner's choice) and update `BREVO_SENDER_EMAIL` in Vercel.
3. **Check:** each of these arrives in a real inbox, not spam:
   - the order confirmation email;
   - email verification;
   - password reset;
   - the contact-form notification.

## 5. Photos and catalog
1. Confirm the Vercel **Blob** store is connected (`BLOB_READ_WRITE_TOKEN` in Production). **Check:** upload a photo in admin on the live site; it shows on the storefront with a `blob.vercel-storage.com` URL.
2. Once the owner's real products are in, archive the 14 placeholder products, with the owner's yes 🔒. **Do not delete them.**
3. **Check:** `curl -s https://<domain> | grep -c gentlepark` returns **0**, and every category shows real products.

## 6. Search, analytics, sharing
1. **Google Search Console:** add the domain property, put the verification code in `/admin/site`, and submit `https://<domain>/sitemap.xml`.
2. **GA4 and Meta Pixel:** the owner creates them, and their IDs go in admin. Confirm with the browser network tab that **nothing loads before cookie consent**, and that events fire after Accept.
3. Share a product link in WhatsApp or Facebook (Facebook Sharing Debugger). The preview shows the right image, title and price.
4. **Check:** robots allows indexing on production. Run Rich Results Test on one product page with no errors.

## 7. Content and legal final pass
- Policy pages, contact page and footer show the **real** business name, address, phone and email.
- **No sample numbers anywhere:** search the live HTML and admin settings for `01711000000` and `1711 000000`.
- **No offers written in page or policy text.** Offers live only in the popup, the marquee and the cart progress bar.

## 8. Final launch test on the real domain (phone and desktop)
1. Place **one real COD order** and **one real bKash order** (smallest amount, sent to the owner's own number).
2. In admin:
   - **Mark as verified** on the bKash order;
   - move both orders through Confirmed → Shipped → Delivered;
   - check that the customer emails arrive.
3. Contact form → `/admin/messages`. Newsletter → Subscribers.
4. Then cancel or delete both test orders, with the owner's yes 🔒.
5. **Monitoring:** turn on Vercel Analytics / Speed Insights if the plan allows. Note the Neon plan's restore window (backups) in the report.

## Report and stop
Write `docs/ROUND11_REPORT.md`: one line per step (Done / Waiting on owner / Failed), each check's result, and anything the owner still has to do. **Stop.** Claude reviews; then the owner announces the launch.

---

## Paste-ready prompt
> Read `docs/HANDOFF_ANTIGRAVITY_ROUND11_GOLIVE.md` fully. Start with step 0: ask me everything in ONE message (domain and registrar, support email, real contact details and bKash/Nagad numbers, products). Then work through steps 1–8 in order. Ask me before every step marked 🔒, and don't start the next step until each check passes. Never print secrets, never push to main, never delete products or orders without my yes. Write `docs/ROUND11_REPORT.md` and stop.
