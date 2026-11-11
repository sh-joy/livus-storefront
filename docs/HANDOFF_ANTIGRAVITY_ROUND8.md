# Round 8: Speed, SEO and final polish (Antigravity executes, Claude reviews)

**Round 7 (live ops: password, numbers, logo, products) is PAUSED.** The owner will do it later. Do **not** touch Neon `production`, Vercel env vars or live admin data in this round. Everything here is **code only** on branch `claude-first-change`. Test locally against `.env.test` (the `round6-test` branch); never against `.env.local`.

**Golden rules (unchanged):**
- Never print secrets. Never `git add -A`. Never push to `main`.
- Never write offers into page or policy text.
- No visible storefront scrollbars.
- **No visual design changes:** the site must look identical before and after. This round is about speed and search, not looks.
- Each agent commits its own work separately, with `tsc`, `npm test` and `npm run build` green before every commit.

---

## 0. Baseline first (mandatory, before any change)
**Measure on a Vercel Preview deployment, not localhost.** Localhost has no network latency and no CDN, so its numbers are fake.
1. Push the current branch `claude-first-change` to origin. **Only this branch, never `main`.** Vercel builds a Preview URL on the same infrastructure as production. Note the URL and the commit.
   - If Preview has Deployment Protection, use Vercel's "Protection Bypass for Automation" token in the Lighthouse request headers. Never print it. Don't disable protection.
   - Preview uses Vercel's *Preview* env vars. Page loads are read-only. **Do not place orders or submit forms on the Preview.**
2. Run Lighthouse (mobile preset) on the Preview URL for `/`, `/for-him`, one product page (always the same slug), and `/checkout`. **Run each page 3 times and record the median**, because the gentlepark image server adds noise. Save scores plus LCP, CLS, TBT and total transfer KB to `docs/perf/baseline.md`.
3. Record the JS bundle size per route from the build output.
4. **About the placeholder photos:** the baseline loads full-size photos straight from `cdn.gentlepark.com`. After P1 the same photos go through `next/image` (resized and served from our domain), which is exactly how real Blob photos will behave. So the comparison is fair. Note in the report that absolute LCP will change again once real photos replace the placeholders.

These numbers are what we compare against at the end. **No baseline, no merge.**

---

## Agent P: Performance (speed)

Claude's audit found these concrete problems. Fix them in this order (biggest win first).

### P1. Images (biggest win)
- **29 storefront files use raw `<img>`**, so full-size photos are sent to phones. Convert storefront product, category, hero and cart images to `next/image` with correct `sizes`.
  - Product grid: `sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"`.
  - Product page gallery: `sizes="(max-width:1024px) 100vw, 50vw"`.
- Add `priority` (or `fetchPriority="high"`) **only** to the first visible image: the homepage first banner and the product page main photo. Everything else lazy-loads.
- Every image needs a fixed aspect ratio (wrapper with `aspect-[4/5]` or width/height), so nothing jumps: CLS must be ≈ 0.
- Check `next.config` `images.remotePatterns` covers the Blob domain (`*.public.blob.vercel-storage.com`) and any domain still used. `formats` already has AVIF/WebP. Keep it.
- Admin may keep `<img>` (not public, not indexed).

### P2. Fonts
- `public/fonts/overused-grotesk-vf.ttf` (55 KB TTF) → convert to **WOFF2** (expect ~25 KB) and update `@font-face`.
- **Preload** the Overused Grotesk woff2 in `layout.tsx` (`<link rel="preload" as="font" type="font/woff2" crossOrigin="">`). Do not preload Big Shoulders, which is only used in the wordmark.
- `layout.tsx` imports **Geist and Geist_Mono from `next/font/google`, but the site uses Overused Grotesk everywhere.** Remove them if unused, after grepping for their CSS variables. If admin uses them, load them only in the admin layout.
- Keep `font-display: swap`.

### P3. JavaScript sent to the browser
- 48 storefront components are `'use client'`. Convert pure-display components to server components: footer columns, policy/info pages, product description, breadcrumbs, static sections. Keep `'use client'` only where state or effects are needed: cart, filters, menu drawer, gallery swipe, popup, forms.
- Load these with `next/dynamic` so they don't block first paint: `PromoPopup`, `CartDrawer`, `MenuDrawer`, the search overlay, and analytics.
- Analytics (Meta Pixel / GA4): load via `next/script` with `strategy="lazyOnload"` (or `afterInteractive` at most), and only when the IDs are set.
- Look for heavy imports in storefront code (e.g. full `lucide-react` barrels in many files, date libraries, `framer-motion`). Import per icon, and drop libraries used for one tiny thing.
- Target: **homepage first-load JS under ~170 KB gzipped**. Report before and after.

### P4. Data and caching
- Storefront pages that read products must use ISR (`export const revalidate = 60` or tagged `revalidateTag` on admin save), not render on every request. Confirm that `/`, category pages and `/product/[slug]` are cached. `getSiteProfile` and `site_content` reads are cached per request (they already use React `cache()`).
- Admin saves (products, site, content, popup) must call `revalidatePath`/`revalidateTag` so changes appear within seconds.
- Product listing queries: select only the columns the card needs, not full descriptions or galleries. Add DB indexes if missing: `products(slug)` unique, `products(status, created_at)`, `order_items(order_id)`. Write each as an **additive** SQL file in `drizzle/manual/0008_perf_indexes.sql` with `IF NOT EXISTS`, and test it on `round6-test` only.

### P5. Cleanup
- Delete unused default files in `public/`: `next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg` (grep first).
- Remove dead components, unused dependencies (`npx depcheck`), and leftover `console.log`.

---

## Agent S: SEO (search and sharing)

The foundation exists from Round 5: metadata helper, JSON-LD, sitemap, robots, OG images. This round makes it complete and correct.

### S1. Every public page has proper metadata
For `/`, all category pages, `/latest`, `/popular`, `/all-products`, product pages, `/about`, `/contact`, and the policy pages:
- a unique `<title>` (50–60 characters) and a unique `description` (140–160 characters, natural English, **no offers or prices in static copy**);
- a canonical URL using `NEXT_PUBLIC_APP_URL`, never localhost in production;
- OG and Twitter tags with an image.
Report a table: route, title, description length.

### S2. Structured data
- Product JSON-LD must include `name`, `image[]`, `description`, `sku`, `brand: LIVUS`, `offers` (`price`, `priceCurrency: BDT`, `availability` from real stock, `url`), and `itemCondition: NewCondition`. Add `shippingDetails` and `hasMerchantReturnPolicy`, **reading values from settings, not hard-coded offers**.
- Validate 3 product pages and the homepage with Google's Rich Results Test or schema.org validator logic. Fix all errors; warnings are optional.
- No fake `aggregateRating` or reviews. Only add them if real reviews exist.

### S3. Crawl health
- The sitemap lists only **active** products and real pages. It excludes archived/draft products, `/search`, auth, checkout and admin. Add `lastModified` from `updated_at`.
- Archived or deleted products: the product URL returns **404** (or a 301 to its category), never a 200 empty page.
- Category pages with filters/sort in the URL: canonical points to the clean category URL.
- One `<h1>` per page, and a logical heading order. Every meaningful image has `alt` (the product name plus its colour); decorative images get `alt=""`.
- Internal links: the product page links to its category (breadcrumb), and the footer links to all categories and policy pages.

### S4. Content for search (small, honest)
- Each category page gets a short intro paragraph (1–2 sentences), editable in `/admin/content` (new `site_content` keys, not new columns). Write defaults in plain language about LIVUS athletic wear in Bangladesh. **No offers.**
- `/about` and the homepage have one clear sentence saying what LIVUS sells and where it ships (Bangladesh).

### S5. Search Console and analytics readiness (code only)
- Verification token fields already exist in `/admin/site`. Confirm the meta tags render when set.
- Write `docs/SEO_OWNER_STEPS.md`: how the owner adds the site to Google Search Console, submits `/sitemap.xml`, sets up GA4 and Meta Pixel IDs in admin, and checks Rich Results. Plain language, step by step.

---

## Agent Q: Quality and accessibility (other things)

- **Accessibility:** run Lighthouse a11y on the 4 pages. Fix:
  - colour contrast below 4.5:1 on body text;
  - missing labels on icon buttons (cart, menu, search, close);
  - the focus ring visible on keyboard navigation;
  - the menu drawer and cart trap focus and close on Esc;
  - form fields have labels.
  
  Target ≥ 95.
- **Best practices:** no console errors on any public page. All external links use `rel="noopener"`. Security headers (already present) also cover `Referrer-Policy` and `Permissions-Policy`.
- **Error and empty states:** test the 404 page, an empty search result, an empty cart, and a sold-out product. Each must look intentional.
- **Mobile:** test at 375px and 414px. No horizontal scroll and no overlapping elements. Tap targets ≥ 44px.
- **Tests:** add unit tests for the sitemap (excludes archived), product JSON-LD shape, and metadata uniqueness helper.

---

## Final: compare, report, stop
1. Push the branch again (it gets a new Preview URL). Re-run the exact Lighthouse runs from step 0 on it, with 3 runs per page and the median. Save the results to `docs/perf/after.md`.
2. Write `docs/ROUND8_REPORT.md`:
   - a before → after table (Performance, LCP, CLS, TBT, JS KB, transfer KB, SEO score, Accessibility score) for the 4 pages;
   - what changed, per agent, with commit hashes;
   - anything not done, and why.
3. **Targets (mobile Lighthouse):** Performance ≥ 85 on `/` and the product page, SEO = 100, Accessibility ≥ 95, Best Practices ≥ 95, CLS < 0.05, LCP < 2.5 s.

   The gentlepark placeholder photos may hold back LCP. Note this; real Blob photos will fix it in Round 7.
4. **Stop.** Do not push to `main`. Claude reviews, then releases. After release, the owner runs PageSpeed Insights on https://mylivus.vercel.app as the real check. Real-user Core Web Vitals appear in Search Console about 28 days after launch.

---

## Paste-ready prompt

> Read `docs/HANDOFF_ANTIGRAVITY_ROUND8.md` fully and follow it. Round 7 live ops are paused: do NOT touch Neon production, Vercel or live admin data. Code only, testing against `.env.test`. Start with step 0: push only the `claude-first-change` branch to get a Vercel Preview URL, and run the baseline Lighthouse there (3 runs per page, median), not on localhost, then run Agents P (performance), S (SEO) and Q (quality/accessibility). Only one agent may edit a file at a time, and each agent commits separately with tsc, tests and build green. The site must look exactly the same: no design changes, no offers in text, no visible scrollbars, never push to main. Finish with the before/after comparison in `docs/ROUND8_REPORT.md` and stop.
