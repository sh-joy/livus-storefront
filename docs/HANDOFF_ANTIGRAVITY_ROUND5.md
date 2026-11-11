# Handoff to Antigravity — Round 5: Admin-editable site, SEO, and go-live setup

**From:** Claude (acting as senior developer / reviewer)
**To:** Antigravity (lead) and its parallel agents
**Repo:** `/Users/shamimhossen/.gemini/antigravity/my-store` · branch `claude-first-change`
**Live site:** https://mylivus.vercel.app (Vercel project `my-store`, production = `main`)
**Current state:** commit `c27bbad`. Storefront redesign is done and live. Type check, 11 unit tests and production build pass.

The owner wants three things:
1. **Everything a shop owner would change is editable in Admin** — brand logo, contact details, address, social links, page text, share (link preview) details.
2. **Proper SEO** — titles, descriptions, share images, structured data, sitemap, indexing rules, verification tags.
3. **Finish the go-live setup** using the owner's Vercel and Neon access (Blob store, env vars, database migrations, passwords), plus data clean-up.

When all of this is done, **stop and report back**. Claude will run the full test and push to production. **Do not push to `main`.**

---

## 0. Golden rules (every agent)

1. **Branch:** work on `claude-first-change`. Commit small, clear commits. **Never push to `main`** and never force-push.
2. **Before every live change** (Vercel settings, Neon database, DNS, OAuth apps, deleting data) tell the owner exactly what will change and wait for "yes".
3. **Never print, log, commit or paste secrets** (passwords, `DATABASE_URL`, tokens). Never commit `.env*` or `.admin-credentials.json`.
4. **Database changes are additive only**: new SQL files in `drizzle/manual/` (next is `0007_…`), using `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `ON CONFLICT DO NOTHING`. Update `src/db/schema.ts` to match.
   - **Do not add columns to `store_settings`.** Drizzle selects every column, so a missing column breaks checkout until the migration runs. Put new settings in the existing `site_content` key/value table (see §2).
   - All new reads must **work before the migration is run** (try/catch → sensible default), exactly like `src/app/actions/promo-popup.ts` and `src/app/actions/site-content.ts`.
5. **Admin actions** must call `requireAdmin()` (superadmin where noted), validate input with **zod**, and `revalidatePath(...)` the pages they affect.
6. **Reuse the design system** — don't invent new styles:
   - Type: `t-display`, `t-h2`, `t-h3`, `t-lead`, `t-body`, `t-small`, `t-eyebrow`, `t-nav` (in `src/app/globals.css`). Font: Overused Grotesk; the LIVUS wordmark only uses Big Shoulders.
   - Buttons `lv-btn lv-btn--solid|outline|light` (44px). Inputs 44px. Page side padding `px-[var(--lv-gutter)]`.
   - Text written by the owner is rendered with `src/components/storefront/RichText.tsx` (supports `**bold**`, `- bullets`, blank-line paragraphs, auto-bold "Label:").
   - Admin pages use the shadcn kit in `src/components/ui/*` (Card, Button, Input, Switch). Copy the patterns in `src/app/admin/popup/page.tsx` and `src/components/admin/ProductPageTextEditor.tsx`.
7. **Images** uploaded in Admin go through the existing `POST /api/upload` (admin-only, ≤4 MB, Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set). Shrink in the browser first (see `shrinkImage` in `src/app/admin/popup/page.tsx`).
8. **After every change:** `npx tsc --noEmit`, `npm test`, `npm run build`. Do not run `next build` in the same folder while `next dev` is running (it corrupts `.next`); build in a copy or stop dev first.
9. Check every storefront change at **375px (phone) and 1440px (desktop)**. No sideways scroll on phones.

---

## 1. How to split the work (parallel agents)

| Agent | Workstream | Owns these files (others don't edit them) | Can start |
|---|---|---|---|
| **A** | Site settings foundation + Brand & Contact admin | `src/lib/site-profile.ts` (new), `src/app/actions/site-settings.ts` (new), `src/app/admin/site/page.tsx` (new), `src/components/admin/AppSidebar.tsx`, `drizzle/manual/0007_site_profile.sql` (new) | **First** |
| **B** | SEO & share previews | `src/app/layout.tsx`, all `src/app/**/layout.tsx` metadata, `src/app/**/page.tsx` `generateMetadata`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts`, `src/app/opengraph-image.tsx`, `src/lib/seo.ts` (new), `src/components/seo/*` (new) | After A's §2.1 types are merged |
| **C** | Editable page content | `src/app/about/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/shipping-returns/page.tsx`, `src/app/contact/page.tsx`, `src/imports/Homepage/index.tsx` (texts only), `src/figma-components/SiteFooter.tsx`, `src/app/admin/content/page.tsx` (new) | After A's §2.1 types are merged |
| **D** | Go-live operations (Vercel, Neon, data) — **no code** | none | **Now**, in parallel |

Order: **A §2.1 → (A rest, B, C in parallel) → D finishes → final report.** D can run from the start because it doesn't touch code.

If two agents need the same file, A decides and makes the change.

---

## 2. Agent A — Site settings foundation + "Brand & Contact" admin

### 2.1 Data model (do this first, merge, then tell B and C)

Store one JSON document in the existing `site_content` table (`key = 'site_profile'`, `value = JSON string`). Create `src/lib/site-profile.ts`:

```ts
// shape (validate with zod; every field optional with a safe default)
SiteProfile = {
  brand: { name: string; tagline: string; logoUrl: string; logoDarkUrl: string; faviconUrl: string };
  contact: { email: string; phones: string[]; whatsapp: string; hours: string; address: string; mapUrl: string };
  social: { facebook: string; instagram: string; tiktok: string; youtube: string; x: string; linkedin: string };
  footer: { about: string };                 // the description under the footer logo (RichText)
  seo: {
    titleTemplate: string;                   // e.g. "%s | LIVUS"
    defaultTitle: string;                    // home page title
    defaultDescription: string;
    shareImageUrl: string;                   // default Open Graph image (1200×630)
    keywords: string[];
    twitterHandle: string;
    googleVerification: string;              // Search Console meta token
    facebookDomainVerification: string;      // Meta domain verification token
  };
}
```

- `getSiteProfile()` (server, cached per request with `react` `cache`) → saved values merged over defaults. Defaults = today's hard-coded values (support email/phone from `store_settings`, current footer text, current social URLs, current titles/descriptions in `src/app/layout.tsx`).
- `src/app/actions/site-settings.ts`: `getAdminSiteProfileAction()` (admin), `saveSiteProfileAction(input)` (**superadmin**; zod; URLs must be `https://` or empty; phones must match the BD regex `^(?:\+?88)?01[3-9]\d{8}$` or be empty; trim everything) → upsert `site_content`, then `revalidatePath('/', 'layout')`.
- Public read for client components: a small server action `getPublicSiteProfileAction()` returning only public fields (no tokens other than the verification ones, which are public anyway).
- Migration `drizzle/manual/0007_site_profile.sql`: nothing new is strictly needed (table comes from 0006), but include `CREATE TABLE IF NOT EXISTS site_content …` again so 0007 works on its own, and `INSERT … ('site_profile', '{}') ON CONFLICT DO NOTHING`.
- Unit tests in `tests/site-profile.test.ts`: defaults when empty, merge of partial JSON, validation rejects bad URLs/phones.

### 2.2 Admin page `Admin → Site & Brand` (`/admin/site`)

Sections (cards), each with Save, live preview where useful, and the yellow "run migration" notice if the table is missing (copy from `/admin/popup`):

1. **Brand** — store name, tagline, **logo upload** (light background), **logo upload for dark backgrounds** (sign-in panel, menu drawer), **favicon upload** (square PNG ≥ 512px). Show previews. "Remove" returns to the text wordmark.
2. **Contact** — support email, one or more phone numbers, WhatsApp number, opening hours, address (multi-line), Google Maps link.
3. **Social links** — Facebook, Instagram, TikTok, YouTube, X, LinkedIn (empty = hidden on the site).
4. **Footer text** — the about paragraph (RichText editor with bold button, like `ProductPageTextEditor`).
5. **Search & sharing (SEO)** — title template, home title, default description (show character counter: aim 50–60 title, 140–160 description), keywords, **default share image upload** (warn if not 1200×630), Twitter/X handle, Google Search Console token, Facebook domain verification token. Include a **Google result preview** and a **Facebook/WhatsApp link preview card** that update as you type.

Add **"Site & Brand"** to `AppSidebar.tsx`. Move the existing support email/phone fields: keep them in Store Settings for checkout emails, but make `/admin/site` the source of truth for what shoppers see (read `store_settings` only as a fallback default).

### 2.3 Wire the storefront to the profile (A owns these edits)

- `src/figma-components/SiteNav.tsx`, `MenuDrawer.tsx`, `SignInPage.tsx`/`SignUpPage.tsx`/`verify-email` header: show the uploaded logo (`next/image`, height 28–32px, `alt={brand.name}`); keep the Big Shoulders text wordmark when no logo is set.
- Favicon / apple-touch-icon: if `faviconUrl` is set, use it in metadata (Agent B wires metadata; A exposes the value).
- Hand the profile to **C** for the footer/contact wiring (C owns `SiteFooter.tsx` and `contact/page.tsx`).

**Done when:** owner can change logo, phones, address, socials, footer text and SEO defaults in Admin, press Save, refresh the site and see them everywhere; nothing breaks if the table is missing; tests pass.

---

## 3. Agent B — SEO & share previews

Build on what exists: `src/app/layout.tsx` (metadataBase, title template, OG/Twitter defaults), `opengraph-image.tsx`, `manifest.ts`, `sitemap.ts`, `robots.ts`, per-route `layout.tsx` metadata, product `generateMetadata` + Product JSON-LD in `src/app/product/[slug]/page.tsx`.

### 3.1 Metadata from Admin
- Root `generateMetadata()` in `src/app/layout.tsx` reads `getSiteProfile()`: title template, default title/description, keywords, OG/Twitter defaults (site name, locale `en_BD`, type `website`, share image), `verification: { google, other: { 'facebook-domain-verification': … } }`, icons (favicon from profile, fallback `/favicon.ico`), `themeColor`/`viewport` export.
- `manifest.ts` uses brand name, tagline and favicon.

### 3.2 Every page has a real title, description, canonical and share card
| Page | Title | Description / share image |
|---|---|---|
| `/` | profile `defaultTitle` (absolute) | profile description, default share image |
| `/all-products`, `/for-him`, `/for-her`, `/unisex`, `/accessories`, `/latest`, `/popular` | e.g. "For Him — Jerseys & Streetwear" | page subtitle text; share image = first product image (fallback default) |
| `/product/[slug]` | product name | first ~155 chars of description (strip `**`), product image, `og:type` product, price/currency |
| `/about`, `/contact`, `/privacy`, `/terms`, `/shipping-returns` | page title | first paragraph of the page text |
| `/search` | "Search" | **noindex** |
| `/checkout`, `/profile`, `/order-confirmed`, `/signin`, `/signup`, `/verify-email`, `/forgot-password`, `/admin/*` | as now | **noindex, nofollow** |
- Canonical URLs everywhere (`alternates.canonical`). Listing pages with filters must canonicalise to the clean URL.
- Put shared helpers in `src/lib/seo.ts` (`pageMetadata({ title, description, path, image, noindex })`).

### 3.3 Share images
- Dynamic OG images (`next/og`, 1200×630) for products (`src/app/product/[slug]/opengraph-image.tsx`: product photo + name + price + LIVUS wordmark) and for listing pages. Use the default share image from Admin when set.
- Test with: Facebook Sharing Debugger, WhatsApp link preview, X card validator, LinkedIn Post Inspector (after deploy, Claude/owner will run these).

### 3.4 Structured data (JSON-LD, escape `<` like the existing product JSON-LD)
- `Organization` (name, url, logo, `sameAs` = social links from Admin, contactPoint with phone/email, address).
- `WebSite` with `SearchAction` → `/search?q={search_term_string}`.
- `Product` (existing) — make sure it has `offers.availability` from stock, `priceCurrency: BDT`, `brand`, `image[]`, `sku`.
- `BreadcrumbList` on product and listing pages.
- `FAQPage` on `/contact` (from the FAQ list).
- Validate with Google Rich Results Test (owner/Claude after deploy).

### 3.5 Sitemap & robots
- `sitemap.ts`: include all public pages, every active product (with `lastModified` = updated date, and `images`), and category pages. Exclude noindex pages.
- `robots.ts`: keep current disallows, add `/search` query results and `/signin`, `/signup`. Sitemap URL from `NEXT_PUBLIC_APP_URL`.

### 3.6 Analytics & pixels (ad tracking)
- `src/components/AnalyticsScripts.tsx` loads Meta Pixel and GA4 from `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_ID`, but **only page views are sent today**. Ads need the shopping events.
- Add `src/lib/analytics.ts` with safe helpers (no-op when the IDs aren't set or the scripts haven't loaded) and fire:
  | Moment | Meta Pixel | GA4 |
  |---|---|---|
  | Product page opened | `ViewContent` | `view_item` |
  | Add to cart (`handleAddToCart` in `src/imports/ProductDetails-1/index.tsx`) | `AddToCart` | `add_to_cart` |
  | Checkout page opened with items | `InitiateCheckout` | `begin_checkout` |
  | Order placed (`/order-confirmed`, once per order number — guard with sessionStorage) | `Purchase` | `purchase` |
  | Newsletter / popup sign-up | `Lead` | `sign_up` |
  Include `value`, `currency: 'BDT'`, `content_ids`/`items` (product id or SKU), `content_type: 'product'`, quantity.
- Route changes in the App Router must also send `PageView` (check it does today).
- Document how to test with Meta Pixel Helper / Events Manager "Test events" and GA4 DebugView. Don't move the IDs into Admin this round.

**Done when:** every route in the table has correct `<title>`, description, canonical, OG/Twitter tags and robots directives (check with `curl -s URL | grep -E "<title|og:|twitter:|canonical|robots"`), JSON-LD validates, sitemap lists products, Lighthouse SEO score ≥ 95 on home, a listing page and a product page.

---

## 4. Agent C — Editable page content

Use `site_content` keys (one key per block) and the `RichText` renderer. Each editor = textarea + bold button + live preview + Save + "clear to restore default", like `src/components/admin/ProductPageTextEditor.tsx`.

New admin page **`Admin → Pages & Text`** (`/admin/content`) with tabs or cards for:
| Key | Where it shows | Default |
|---|---|---|
| `about_page` | `/about` body | current About text |
| `privacy_page`, `terms_page`, `shipping_page` | `/privacy`, `/terms`, `/shipping-returns` | current text |
| `contact_intro` | "Get in touch" paragraph on `/contact` | current text |
| `contact_faqs` | FAQ list on `/contact` (JSON array of `{q, a}`; editor with add/remove/reorder rows) | current 6 FAQs |
| `home_collection_text` | "Explore the collection" description on `/` | current text |
| `newsletter_cta` | footer newsletter block: heading, text, button label, image upload | current text and jersey image |
| `shipping_returns` | product page section (already exists — just link to it from this page) | — |

Wire the pages:
- `SiteFooter.tsx`: footer about text, address, email, phones, social links (hide empty ones; add TikTok/YouTube icons), newsletter CTA texts/image — all from Agent A's profile / these keys.
- `contact/page.tsx`: intro, contact rows (all phones, WhatsApp link `https://wa.me/880…`, hours, address with map link), FAQs.
- Info pages: render `RichText` from their keys inside the existing `InfoPage` layout.

**Done when:** the owner can change any of these texts in Admin and see them on the site after refresh; pages still render the defaults when nothing is saved or the table is missing; no layout changes beyond the content.

---

## 5. Agent D — Go-live operations (owner's Vercel & Neon accounts)

Ask the owner before each item and report each as done / waiting / failed. Work in the owner's signed-in browser sessions.

1. **Neon (database)**
   - First create a **branch** in Neon, run `drizzle/manual/0006_promo_popup.sql` then `0007_site_profile.sql` on the branch, check the site against it (Vercel Preview env can point at the branch), then run both on the **main** database.
   - **Rotate the database password** (old one is in git history). Update `DATABASE_URL` in Vercel (Production + Preview) and in local `.env.local`.
   - Confirm the plan's point-in-time restore window; make sure there's a spending limit + alert.
2. **Vercel**
   - **Storage → Create → Blob** store, connect it to project `my-store` (Production + Preview). This sets `BLOB_READ_WRITE_TOKEN`. Then upload one test product photo in Admin on the live site and confirm it shows.
   - Check env vars from `docs/DEPLOYMENT.md` §b are set for Production and Preview (`BETTER_AUTH_SECRET` strong and different from local, `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL` = the live https URL, Google/Facebook OAuth keys, Brevo keys, optional `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`). Don't print values.
   - Turn on spend limit + usage alerts. Note whether the project is on Hobby (non-commercial) — owner should move to Pro for a commercial store.
   - Leave Deployment Protection on for Preview; production must stay public.
3. **Admin passwords** — run `npm run admin:set-password -- superadmin@livus.com '<strong password>' "Super Admin" superadmin` from the project folder against the live DB (generate a 16+ char password, show it to the owner once). Ask whether to delete the test admin accounts.
4. **Store data (Admin, owner confirms each)** — real bKash/Nagad numbers and support phone/email in Settings; review promo codes GIFT2000 (৳2,000 off, unlimited) and SAVE500; delete test orders (LIV-33333, LIV-63185, LIV-53039 and any test orders since); check every product is in the right category (e.g. a women's kurta currently shows under For Him); accessories should have a single "One Size".
5. **Product photos** — most still load from `cdn.gentlepark.com` (another brand). Ask the owner for LIVUS photos and replace them product by product through Admin (needs the Blob store).
6. **Domain (only if the owner has one now)** — add in Vercel → Domains; update `BETTER_AUTH_URL`/`NEXT_PUBLIC_APP_URL`; add `https://<domain>/api/auth/callback/google` and `/facebook` to the OAuth apps; Brevo sender domain (SPF/DKIM/DMARC); Search Console + submit sitemap; Meta domain verification (token goes into Admin → Site & Brand → SEO).

---

## 6. Things we might be missing (pick up if time allows; ask the owner first)

- **Customer emails**: check order confirmation, status update and verification emails render with the new brand (logo from Admin, support contacts from profile).
- **404 / error pages** use the uploaded logo.
- **Accessibility pass**: every image has alt text, form labels, focus states visible, colour contrast on grey text (`#8a8a8a` on white is borderline — use `#5c5c5c` for important text).
- **Performance**: product images still come from a third-party CDN at full size; once moved to Blob, check LCP on the product page < 2.5s on mobile.
- **Order notification for the owner** (email to support address on every new order) if not already sent.
- **Low-stock alert** in Admin dashboard (data exists: `isLowStock`).

---

## 7. Final report back to Claude (required)

When A–D are done, write `docs/ROUND5_REPORT.md` with:
- What was built per workstream, list of new/changed files, new `site_content` keys, new migrations.
- Output of `npx tsc --noEmit`, `npm test`, `npm run build`.
- Screenshots (phone + desktop) of `/admin/site`, `/admin/content`, footer, contact page, a product page.
- `curl` output of `<title>`/OG/canonical/robots for `/`, `/for-him`, one product, `/checkout`.
- Agent D checklist with done / waiting on owner / failed.
- Known issues or anything skipped.

Then **stop**. Claude will review the diff, run the full end-to-end test on phone and desktop, and push to production.

---

## 8. Copy-paste prompt for Antigravity

> Read `docs/HANDOFF_ANTIGRAVITY_ROUND5.md` in `/Users/shamimhossen/.gemini/antigravity/my-store` and follow it exactly. You are the lead; run four parallel agents as described in section 1 (A: site settings + Brand & Contact admin, B: SEO, C: editable page content, D: Vercel/Neon/data operations). Agent A must finish section 2.1 first and commit it before B and C start. Respect the file-ownership table so agents never edit the same files. Work on branch `claude-first-change`, never push to `main`. Ask me before every live change in Vercel, Neon, OAuth or data deletion, never show or commit secrets, and run `npx tsc --noEmit`, `npm test` and `npm run build` after each change. When everything is done, write `docs/ROUND5_REPORT.md` as described in section 7 and stop.

---

## 9. Addendum from Claude (read before continuing Agent C and B)

**9.1 Build blocker in Agent C's in-progress work — fix first**
`src/app/actions/site-content.ts` starts with `'use server'`. A server-action file may **only export async functions**, but it now exports constants (`SITE_CONTENT_KEYS`, `DEFAULT_FAQS`, `DEFAULT_NEWSLETTER_CTA`, `DEFAULT_CONTENT`) and interfaces are fine but constants are not. `next build` will fail with "Only async functions are allowed to be exported in a 'use server' file".
→ Move the constants and types into `src/content/site-content-defaults.ts` (no `'use server'`) and import them from both the action file and the admin page.

**9.2 Full policy text is ready — use it as the defaults**
Claude wrote complete, plain-language policies in `src/content/policy-defaults.ts` (RichText format):
- `privacyPolicyText(ctx)` → default for `privacy_page`
- `termsText(ctx)` → default for `terms_page` (fixes the old wrong line "prices inclusive of VAT" — VAT is added at checkout)
- `shippingReturnsText(ctx)` → default for `shipping_page` (no hard-coded ৳100/৳150; uses the real fee and only mentions free delivery when it is on)
- `cookiesPolicyText(ctx)` → default for a new `cookies_page` key

`ctx` = `{ storeName, supportEmail, supportPhone, deliveryFeeBdt, freeDeliveryOverBdt }`. Build it from Agent A's site profile (fallback `store_settings`). Replace the short placeholder texts in `DEFAULT_CONTENT` with calls to these functions (they need the ctx, so compute the default inside `getSiteContentAction`, the same way `defaultShippingText()` works).

**9.3 New Cookie Policy page**
Claude added `/cookies` (`src/app/cookies/page.tsx`, currently renders `cookiesPolicyText` directly). Agent C: add `cookies_page` to the content keys and the Pages & Text editor, then switch the page to `getSiteContentAction('cookies_page')`. Add **"Cookie policy"** under Legal in the footer (`SiteFooter.tsx`). Agent B: add `/cookies` to `sitemap.ts` and give it metadata. If the owner later targets EU visitors, add a cookie consent banner that loads the Meta Pixel / GA only after consent — not needed for Bangladesh-only sales now.

**9.4 Keep these small spacing edits Claude made in files Agent C is editing (they are uncommitted in the working tree)**
- `SiteFooter.tsx`: footer main block top padding is `pt-[clamp(40px,6vw,88px)]` when the newsletter block is shown (same as the gap above the newsletter block), and stays `pt-[clamp(32px,4vw,56px)]` for the slim footer.
- `InfoPage.tsx`: intro `mt-3`; prose block `mt-[clamp(14px,1.8vw,20px)] pt-[clamp(14px,1.8vw,20px)]` (smaller gap between title and text).

**9.5 Rule: never write offers into page or policy text (owner's decision)**
Free delivery, discounts and other promotions change at any time, so they must **not** appear in policies, FAQs, default page text or the product-page shipping text. They may only appear in:
- the cart/checkout free-delivery progress bar (already shown only while the offer is switched on in Admin → Settings),
- the marquee banner and offer popup, which the owner edits in Admin.
Claude removed the free-delivery lines from `policy-defaults.ts`, the delivery FAQ and `defaultShippingText()` in `src/content/site-content-defaults.ts` (that file is Agent C's and still uncommitted — keep these removals). Don't add them back.
