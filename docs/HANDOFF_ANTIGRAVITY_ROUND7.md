# Round 7: Go-live operations (Antigravity executes, Claude reviews)

**Branch:** `claude-first-change`. Claude reviewed Round 6: tsc is clean, tests pass 23/23, the build passes, the test branch is clean, and live is untouched. **The code is production-ready.**
This round does the remaining live operations. **The owner has approved the tasks below.** Do them in order. Each task has a **check** that must pass before the next task starts. If a check fails, stop, roll back as described, and report.

Golden rules still apply:
- Never print secrets.
- Never write offers into page or policy text.
- No visible storefront scrollbars.
- No speed or SEO work this round.
- Never `git add -A`.

---

## Task 1: Run migrations on the live database (approved)
1. Use `.env.local` (live: `ep-wild-paper`). Run `drizzle/manual/0006_promo_popup.sql`, then `0007_site_profile.sql`, once each.
2. **Check:** the tables `site_content`, `promo_popup` and `contact_messages` exist. Counts for `products` (14), `orders` (0) and `customers` (2) are **unchanged**.
3. Rollback (only if something breaks): these tables are new and unused by old code. Drop only the 3 new tables.

## Task 2: Rotate the Neon database password (approved)
1. Neon project `muddy-block-03303704`, branch `production`: reset the password for role `neondb_owner`.
2. Immediately update `DATABASE_URL` in Vercel for **Production and Preview** with the new pooled string. Also update the local `.env.local`. Never print the string.
3. Redeploy the current Production deployment in Vercel.
4. **Check:** https://mylivus.vercel.app loads products, and `/for-him` and a product page return 200. Local `npm run dev` also loads products.
5. If the live site errors: the env var is wrong. Fix it in Vercel and redeploy. Do not stop halfway: the old password no longer works.

## Task 3: Vercel Blob storage
1. Vercel → project → Storage. If no Blob store is connected, create one named `livus-media` and connect it to Production and Preview.
2. **Check:** `BLOB_READ_WRITE_TOKEN` exists in Vercel Production (check the name only). Report "already existed" or "created".

## Task 4: Vercel environment variables
1. Confirm these **names** exist in Production: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `BLOB_READ_WRITE_TOKEN`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`.
2. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must be `https://mylivus.vercel.app` (not localhost). Fix them if wrong.
3. Google/Facebook sign-in: confirm the OAuth redirect URIs include `https://mylivus.vercel.app/api/auth/callback/google` (and the same for `facebook`). If you can't access the provider console, list it as an owner action.

## Task 5: Owner details (ask the owner in chat for the values, then enter them in admin)
Ask the owner **once**, in one message, for all of the following:
- Logo file (light and dark if available), favicon
- Support phone, WhatsApp number, support email, business address
- Facebook, Instagram, TikTok links
- bKash merchant number, Nagad merchant number

Enter them in `/admin/site` and `/admin/settings` on the **live** site, and save.
**Check:** the footer, contact page and checkout show the new values. bKash and Nagad appear at checkout. Skip any field the owner leaves blank, and list it in the report.

## Task 6: Real products (with the owner)
1. Ask the owner for real LIVUS products: name, category, price, sizes and stock, description, and photos (as files or a folder path).
2. Create each one in `/admin/products` on the live site. Upload the photos through the admin uploader so they go to Blob. Use tags `new`/`popular` as the owner wants.
3. Then, **with the owner's yes**, set the 14 placeholder products (the table in `ROUND6_REPORT.md`) to **Archived/Draft. Do not delete them.**
4. **Check:** the homepage HTML has **0** `gentlepark.com` image URLs: `curl -s https://mylivus.vercel.app | grep -c gentlepark` returns 0. Every category shows real products or a friendly empty state.
5. If the owner has no products ready yet, do steps 1–3 only for what they give you, and report the rest as waiting.

## Task 7: Cleanup
1. Delete the Neon branch `round6-test` and delete `.env.test`.
2. Remind the owner in your final message to revoke the Neon API key used in Round 6.

---

## Report and stop
Write `docs/ROUND7_REPORT.md`:
- one line per task: Done / Waiting on owner / Failed, plus the check result;
- what the owner still needs to do;
- commit hashes, if any.

Keep it short. **Do not push to `main`**. Claude reviews, then releases. The next round is speed and SEO.
