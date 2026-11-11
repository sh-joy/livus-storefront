# LIVUS — Deployment Guide

A step-by-step guide to putting the LIVUS store live on your own domain. You don't need to write code; you'll copy values between websites and click buttons. Do the sections in order.

Related docs: [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) (business / content tasks before ads) · [`SQA_REPORT.md`](./SQA_REPORT.md) (test results).

---

## (a) What you need

| Service | Plan | Why |
|---|---|---|
| **GitHub** | Free | Holds the code; Vercel deploys from it. |
| **Vercel** | **Pro** (required for commercial sites) | Hosts the website. Set a spend limit and usage alerts in Settings → Billing. |
| **Neon** | **Launch** | The Postgres database. The free plan pauses when its compute runs out. Set a spend limit. |
| **Vercel Blob** store | Included with Vercel (pay per use) | Stores photos uploaded in Admin → Products. |
| **Brevo** | Free to start; upgrade if you exceed the daily cap | Sends order confirmations and password-reset emails. You need a **verified sender domain**. |
| **Domain name** | Any registrar | e.g. `yourdomain.com` or `yourdomain.com.bd`. |
| **Cloudflare** (optional) | Free | DNS management if you prefer it over your registrar's. |
| Google Cloud project, Meta developer app (optional) | Free | "Sign in with Google / Facebook". |

Turn on two-factor login on every one of these accounts.

---

## (b) Environment variables

Environment variables are the settings and passwords the site reads when it starts. Set them in **Vercel → your project → Settings → Environment Variables**. Tick **Production** and **Preview** for each one (Preview can point at a Neon test branch — see section c).

The site checks these at startup (`src/lib/env.ts`). On a production deployment, if a **required** variable is missing or wrong, the site refuses to start and the Vercel logs show an `[env] LIVUS cannot start` message that lists every problem. Missing **recommended** variables only log a warning.

| Name | Required? | Where to get it | Example format |
|---|---|---|---|
| `DATABASE_URL` | **Required** | Neon → your project → **Connect** → pooled connection string | `postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | **Required**, at least 32 characters | Generate it yourself: run `openssl rand -base64 32` in Terminal, or use a password manager to make a 40+ character random string. Use a different one from your local copy. | `k3J9...` (44 random characters) |
| `BETTER_AUTH_URL` | **Required** (this or `NEXT_PUBLIC_APP_URL`) | Your site address. Must start with `https://` in Production. | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | **Required** (this or `BETTER_AUTH_URL`); set both to the same value | Same as above. Used in emails, sitemap and share links. | `https://yourdomain.com` |
| `ADMIN_SESSION_SECRET` | Optional (legacy) | Only used if `BETTER_AUTH_SECRET` is missing. You can leave it unset. | random string |
| `BREVO_API_KEY` | Recommended | Brevo → top-right menu → **SMTP & API** → **API Keys** → Generate | `xkeysib-...` |
| `BREVO_SMTP_USER` | Recommended (fallback) | Brevo → SMTP & API → **SMTP** tab → Login | `xxxx@smtp-brevo.com` |
| `BREVO_SMTP_KEY` | Recommended (fallback) | Same tab → **Generate a new SMTP key** | `xsmtpsib-...` |
| `BREVO_SMTP_HOST` | Optional | Defaults to `smtp-relay.brevo.com` | `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | Optional | Defaults to `587` | `587` |
| `BREVO_SENDER_NAME` | Recommended | Name customers see on emails | `LIVUS` |
| `BREVO_SENDER_EMAIL` | Recommended | An address on your Brevo-verified domain | `orders@yourdomain.com` |
| `BLOB_READ_WRITE_TOKEN` | Recommended (needed for admin photo uploads) | **Added automatically** when you connect a Blob store (section e) | `vercel_blob_rw_...` |
| `GOOGLE_CLIENT_ID` | Optional (pair) | Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application) | `1234-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional (pair) | Same OAuth client | `GOCSPX-...` |
| `FACEBOOK_CLIENT_ID` | Optional (pair) | developers.facebook.com → your app → App settings → Basic → App ID | `123456789012345` |
| `FACEBOOK_CLIENT_SECRET` | Optional (pair) | Same page → App secret | 32 hex characters |
| `APPLE_CLIENT_ID` | Optional (pair) | Apple Developer → Identifiers → Services ID | `com.yourdomain.store` |
| `APPLE_CLIENT_SECRET` | Optional (pair) | Generated Sign in with Apple client secret (JWT) | `eyJ...` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Recommended before ads | Meta Events Manager → Data sources → your Pixel → Pixel ID | `123456789012345` |
| `NEXT_PUBLIC_GA_ID` | Recommended | Google Analytics → Admin → Data streams → Web → Measurement ID | `G-XXXXXXXXXX` |
| `VAT_PERCENT` | Optional | Fallback VAT %. Default `10`. | `10` |
| `DELIVERY_CHARGE_BDT` | Optional | Fallback delivery charge in BDT. Default `150`. | `150` |

"Pair" means set **both** or **neither** — the site warns if only one half is set. If you set neither, that sign-in button simply isn't offered.

`S3_*` variables in `.env.example` are not used by the app yet; leave them unset. `VERCEL_*`, `NODE_ENV`, `CI` and `NEXT_*` (other than the ones above) are set automatically — don't add them.

> After changing any variable in Vercel you must **redeploy** (Deployments → ⋯ → Redeploy) for it to take effect. `NEXT_PUBLIC_*` values are baked in at build time.

---

## (c) Database

**First: rotate the database password.** An old Neon password is in the git history. In **Neon → Roles → neondb_owner → Reset password**, then put the new connection string in `DATABASE_URL` (Vercel and your local `.env.local`).

**How migrations work in this repo**

- The table definitions live in `src/db/schema.ts`. `drizzle/0000_careful_vermin.sql` is the original schema.
- Every later change is a hand-written, **additive** SQL file in `drizzle/manual/`, numbered in order (`0001_…sql`, `0002_…sql`, …). They use `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`, so running one twice is harmless.
- `0001`–`0004` are already applied to the current database. `0005_accessories_category.sql` creates the Accessories category and moves the tie, cufflinks and belt into it — if `/accessories` is empty on your live site, run it.

**Running a new migration file**

1. **Test first on a Neon branch:** Neon → **Branches** → **Create branch** from `main` (e.g. `test-0006`). It's an instant copy of your live data.
2. Open **SQL Editor**, choose the test branch, paste the whole contents of the new `drizzle/manual/000X_….sql` file, click **Run**.
3. Point a local copy or a Vercel Preview deployment at the branch's connection string and check the site works.
4. Repeat step 2 on the **main** (production) branch. Delete the test branch when done.

Recommended: keep a permanent `preview` Neon branch and use its connection string as `DATABASE_URL` for the **Preview** environment in Vercel, so test deployments never touch real orders. Also confirm your plan's point-in-time restore window and try one restore to a branch.

---

## (d) First admin

Admin logins are stored in the database. To create the superadmin or reset its password, run this **on your computer** from the project folder, with `DATABASE_URL` in `.env.local` set to the **production** connection string:

```bash
npm run admin:set-password -- owner@yourdomain.com 'A-long-unique-password' "Owner Name" superadmin
```

- Arguments: `<email> <password> "<name>" <role>` (role is `superadmin` or `admin`).
- Running it again for the same email **rotates** the password.
- Put the password in single quotes so symbols like `$` or `!` aren't changed by the shell.
- Then sign in at `https://yourdomain.com/admin/login`. Add, remove or change other admins in **Admin → Settings**. Delete accounts you don't use (e.g. test accounts).
- Afterwards switch `.env.local` back to your test database so local experiments don't touch live data.

---

## (e) Deploy on Vercel

1. **Vercel → Add New → Project → Import** your GitHub repository. Framework is detected as Next.js; leave build settings as default.
2. Before the first deploy, open **Environment Variables** and add everything from section (b) for **Production** (and **Preview**). For the very first deploy you can use the free `https://<project>.vercel.app` address for `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`.
3. **Connect Blob:** project → **Storage** → **Create Database** → **Blob** → connect it to this project for Production and Preview. This adds `BLOB_READ_WRITE_TOKEN` automatically.
4. **Deploy.** Production deploys come from the `main` branch: merge the working branch (e.g. `claude-first-change`) into `main` on GitHub (Pull request → Merge). Every other branch gets its own Preview URL.
5. Open the deployment URL. If it shows an error, open **Deployments → the deployment → Logs** and look for `[env]` lines (see Troubleshooting).

GitHub Actions (`.github/workflows/ci.yml`) also type-checks, tests and builds every push with dummy values; a red ❌ there means don't merge yet.

---

## (f) Add your domain

1. **Vercel → project → Settings → Domains → Add** `yourdomain.com` and `www.yourdomain.com`. Choose one as primary; Vercel redirects the other.
2. Vercel shows the DNS records to create. At your registrar (or Cloudflare → DNS):
   - `A` record, name `@`, value shown by Vercel (e.g. `76.76.21.21`)
   - `CNAME` record, name `www`, value shown by Vercel (e.g. `cname.vercel-dns.com`)
   - **On Cloudflare set the proxy to "DNS only" (grey cloud)**, not proxied — otherwise Vercel can't issue the SSL certificate.
3. Wait until Vercel shows **Valid Configuration** and `https://yourdomain.com` loads with a padlock (minutes to a few hours).
4. Update **`BETTER_AUTH_URL`** and **`NEXT_PUBLIC_APP_URL`** to `https://yourdomain.com` (no trailing slash) for Production, then **Redeploy**.
5. **Google sign-in:** Google Cloud Console → Credentials → your OAuth client → **Authorized redirect URIs** → add `https://yourdomain.com/api/auth/callback/google` (and `https://yourdomain.com` under Authorized JavaScript origins). Publish the OAuth consent screen.
6. **Facebook sign-in:** Meta app → Facebook Login → Settings → **Valid OAuth Redirect URIs** → add `https://yourdomain.com/api/auth/callback/facebook`. Add your domain under App settings → Basic → App domains. Switch the app to **Live**.
7. **Brevo:** Senders, Domains & Dedicated IPs → **Domains** → Add domain → create the SPF, DKIM and DMARC DNS records it shows → Verify. Then add your sender address (`BREVO_SENDER_EMAIL`).
8. **Meta Business:** Business Settings → Brand Safety → **Domains** → add and verify your domain (DNS TXT record) — needed for Pixel/ads events.
9. **Google Search Console:** add the domain property, verify via DNS, then **Sitemaps** → submit `https://yourdomain.com/sitemap.xml`.

---

## (g) Go-live checklist

- [ ] Neon password rotated (old one is in git history); new `DATABASE_URL` in Vercel and locally.
- [ ] All admin passwords changed (`npm run admin:set-password …`); unused admin accounts removed in Admin → Settings.
- [ ] Strong, unique `BETTER_AUTH_SECRET` in Vercel Production.
- [ ] **Admin → Settings:** real bKash and Nagad merchant numbers (or disable those options) and real support phone/email — the default `+880 1711 000000` is a placeholder.
- [ ] Product photos hot-linked from `cdn.gentlepark.com` replaced with your own uploads.
- [ ] About, Contact, Privacy, Terms and Shipping & Returns pages reviewed and corrected (they're drafts with placeholder phone/email and a 7-day return rule).
- [ ] Footer Facebook/Instagram links point to **your** pages.
- [ ] Test orders and test customers deleted so reports start clean.
- [ ] One real **Cash on Delivery** order placed **on a phone** end-to-end: browse → add to cart → checkout → confirmation email arrives → order appears in Admin → mark Delivered.
- [ ] Google/Facebook sign-in tested on the live domain; password-reset email received.

The business/marketing items (promo codes, VAT decision, Pixel events, operations) are in [`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md).

---

## (h) Troubleshooting

| Symptom | Check |
|---|---|
| **Site shows 500 / "Application error" right after deploy** | Vercel → Deployments → Logs (or **Logs** tab). An `[env] LIVUS cannot start` message lists exactly which variables are missing or wrong. Fix them in Settings → Environment Variables, then Redeploy. |
| **Sign-in fails / you're logged out immediately / "invalid origin"** | `BETTER_AUTH_SECRET` set (32+ chars) and unchanged between deploys; `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` exactly equal your live `https://` address (no trailing slash, right `www` or not). Redeploy after changing. |
| **Google/Facebook login shows "redirect_uri_mismatch" or "URL blocked"** | The redirect URIs in section (f) steps 5–6 must match your domain exactly. Facebook app must be Live; Google consent screen must be published. |
| **Admin photo upload fails** | Blob store connected to the project (Storage tab) and `BLOB_READ_WRITE_TOKEN` present for that environment. Redeploy after connecting. |
| **No emails (order confirmation / reset code)** | `BREVO_API_KEY` (or SMTP user + key) set; `BREVO_SENDER_EMAIL` is on a verified Brevo domain; Brevo daily limit not exceeded (Brevo → Transactional → Logs); check the customer's spam folder; SPF/DKIM/DMARC verified. |
| **Database errors / "relation does not exist"** | A `drizzle/manual/*.sql` file hasn't been run on this database (section c). Free Neon plans may also be suspended — check Neon's dashboard. |
| **Changes to a variable have no effect** | You must Redeploy after editing variables; `NEXT_PUBLIC_*` are fixed at build time. |
| **Domain stuck on "Invalid Configuration"** | DNS records match what Vercel shows; Cloudflare proxy is **off** (grey cloud); wait for DNS to propagate. |
