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

---

## 8.1 Claude's review fixes (12 Nov 2026), do these and stop

Round 8 is approved: tsc is clean, 25/25 tests pass, the build passes, and the site looks the same. Fix these 4 items in one commit, then stop:

1. **Wrong delivery price in Google product data.** In `src/app/product/[slug]/page.tsx`, JSON-LD `shippingRate.value` is hard-coded `'120'`, but the real charge is ৳150. Read it from the same source checkout uses (store settings / `DELIVERY_CHARGE_BDT`), never hard-coded. Put `merchantReturnDays` (7) and transit days (2–5) in one shared constant next to the policy defaults, so the policy text and the JSON-LD can't drift apart. Add a test that the JSON-LD rate equals the checkout delivery charge.
2. **Meta description wording:**
   - Remove the word **"authentic"** (homepage and `/about`): it implies officially licensed team kits.
   - The `/accessories` description lists "caps, sports socks, gym bags", which we don't sell. Keep it generic ("accessories to complete your look").
   - Never name products or offers that may not exist.
3. **Price format:** the product page shows `৳1450 BDT`. Use a thousands separator everywhere prices appear (product page, cards, cart, checkout, order confirmed, admin): `৳1,450`. Use one shared `formatBdt()` helper.
4. **Admin sign-in font:** `src/app/admin/sign-in/page.tsx` still references `--font-geist-sans`, which was removed. Switch it to the site font.

5. **Rewrite the LIVUS brand copy as a SPORTSWEAR brand.** The current text is generic ("premium", "streetwear culture", "crafted for comfort and style"). Rewrite it using the brief below.

   **Brand brief:**
   - **What LIVUS is:** a Bangladeshi sportswear brand. Jerseys, training tops, tees and activewear made to move in, for the pitch, the gym, the court and the street.
   - **Who it's for:** young people in Bangladesh who play, train and follow sport, and who wear sport as everyday style. For him and her.
   - **What we stand for:** performance you can wear daily, which means breathable fabrics, athletic cuts, and designs that look good on and off the field. Made for Bangladesh's heat and humidity. Accessible prices, with drops released in limited runs.
   - **Voice:** short, confident, energetic, plain English. Speak like a coach, not a luxury brand. Use active verbs: train, play, move, wear. No clichés like "elevate", "curated", "premium quality", "crafted with love", "unleash".
   - **Never:**
     - claim official or licensed team kits, sponsorships, athletes or awards;
     - invent facts such as a founding year, factories or fabric tech names;
     - write offers or prices into the text.

     If a fact is needed, write `[OWNER: …]` as a placeholder and list it in the report.

   **Where to rewrite:**
   - **`about_page` default (`src/content/site-content-defaults.ts`):** 4 short sections, each with a bold heading:
     1. **Built for sport.** What LIVUS is.
     2. **Made for here.** Bangladesh weather, fit, everyday wear.
     3. **How we make it.** Fabric and fit focus, small drops. Only claims that are true; use placeholders where unsure.
     4. **Join the team.** Newsletter and socials.

     About 180–250 words in total.
   - **Homepage:**
     - the "Explore the collection" line (`home_collection_text` default): one sentence, sport-first;
     - the footer brand line or newsletter CTA (`newsletter_cta`) if it is generic.
   - **The 4 category intros:**
     - For Him: training and match-day;
     - For Her: training and active lifestyle;
     - Unisex: shared fits;
     - Accessories: generic.
   - **Meta titles and descriptions** for `/`, `/about` and the category pages: lead with "sportswear" and "jerseys". Example title: `LIVUS | Sportswear & Jerseys in Bangladesh`.
   - **Organization JSON-LD `description`** and the default site description in `site-profile.ts`: one sentence, the same positioning.

   **Example tone** (adapt it, don't copy it blindly):
   > *LIVUS is sportswear from Bangladesh. Jerseys, training tops and tees built to move in: on the pitch, in the gym, and everywhere after. Light fabrics for our heat, athletic cuts that fit, and designs you'll want to wear on rest days too.*

   **All of this copy must be SEO-optimized.** Readable first, keywords second.

   **Keyword map** (one main keyword per page, so pages don't compete with each other):

   | Page | Main keyword | Supporting keywords (use 1–3 naturally) |
   |---|---|---|
   | `/` | sportswear Bangladesh | jerseys BD, activewear, gym wear, online sportswear shop |
   | `/for-him` | men's sportswear Bangladesh | men's jerseys, gym t-shirts for men, training wear |
   | `/for-her` | women's sportswear Bangladesh | women's activewear, gym wear for women, sports tops |
   | `/unisex` | unisex sportswear | unisex jerseys, oversized sports tees |
   | `/accessories` | sports accessories Bangladesh | gym accessories |
   | `/about` | LIVUS sportswear brand | Bangladeshi sportswear brand |
   | `/latest` | new sportswear arrivals | new jerseys, latest drops |
   | `/popular` | best-selling sportswear | popular jerseys |
   | product pages | the product name plus its type ("… jersey", "… training tee") | colour, fit, men's/women's |

   **Rules:**
   - **Placement:** the main keyword goes in the `<title>` (near the start), the meta description, the page `<h1>` or category intro, and the **first sentence** of the intro or body text. Use it once or twice per page. **No keyword stuffing.** It must read like a person wrote it.
   - **Titles:**
     - 50–60 characters, format `Main keyword | LIVUS`, except the homepage, which uses `LIVUS | Sportswear & Jerseys in Bangladesh`.
     - Every title is unique.
   - **Descriptions:**
     - 140–160 characters, each with one benefit (fabric, fit, delivery nationwide, COD/bKash/Nagad);
     - a soft call to action ("Shop now", "Find your fit");
     - every description is unique, with no offers and no prices.
   - **Headings:**
     - one `<h1>` per page containing the main keyword or a natural variant;
     - About page sections use `<h2>`.
   - **Product pages:**
     - **Title template:** `{Product name} | {Men's/Women's} {type} | LIVUS`, trimmed to 60 characters.
     - **Description template:** built from the product's own fields (name, colour, fit, fabric if present) and ending with "Delivery across Bangladesh."
     - Image `alt` = `{Product name} – {colour} – view {n}`.
   - **Internal links:**
     - **About:** link to /for-him, /for-her and /latest with descriptive anchor text, e.g. "men's sportswear", never "click here".
     - **Category intros:** link to one related category.
   - **Bangla:** English only for now (one language per URL). Bangla pages would come later, with `hreflang`. Don't mix languages on one page.
   - **Schema:**
     - Organization JSON-LD: `description` (same positioning), `slogan` only if the owner provides one, and `sameAs` from the social links in the site profile.
     - Product JSON-LD: `category` set to `Sportswear > {type}`.
   - **Verify:**
     - Run the existing metadata-uniqueness test across all pages, plus a test that every title is ≤ 60 characters and every description is 140–160.
     - Add a table to the report: page, main keyword, title, description, and the h1.

   All of this stays editable in `/admin/content` and `/admin/site`. You are only changing the defaults. **Also check the live `site_content` table:** if `about_page` or other keys were saved there earlier, the old text will override the new defaults, so list those keys in the report for the owner. Do not overwrite live data.

Run tsc, tests and build. Commit (copy changes may be a separate commit). Add lines to `ROUND8_REPORT.md` under "8.1 fixes" with the commit hashes, plus the list of `[OWNER: …]` placeholders. Stop.
