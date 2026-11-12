# Round 9: Cookie consent banner and About page redesign (Antigravity executes, Claude reviews)

**Branch:** `claude-first-change`. Code only. Test against `.env.test`. **Never touch production, and never push to `main`.**
**Golden rules (unchanged):**
- no secrets in output;
- no offers in page or policy text;
- no visible storefront scrollbars;
- never `git add -A`;
- tsc, tests and build green before each commit;
- new settings go in `site_content`, not new columns.

**Design rules:** use **our** design system only:
- Overused Grotesk, the type classes `t-display`, `t-h2`, `t-h3`, `t-lead`, `t-body`, `t-small` and `t-eyebrow`;
- `lv-btn` (44px, square corners), `--lv-gutter` and `--lv-line`;
- black / white / neutral palette, no rounded cards.

Gentlepark is only a **layout reference**: never copy its text, images or colours.

Two agents, separate files. They can run in parallel.

---

## Agent K: Cookie consent banner

Today there is a cookies policy page but **no consent banner**, and analytics may load without consent. Build a real consent system, not just a message.

### Behaviour
1. **First visit:** a banner appears.
   - **Desktop:** a bottom-right card, max-width ~560px, white with a 1px `--lv-line` border and a soft shadow.
   - **Mobile:** a full-width bottom sheet, with safe-area padding.

   Content:
   - **Title** (uppercase `t-h3` style): "We use cookies".
   - **Text** (`t-body`, ~2 sentences): essential cookies keep the cart and sign-in working; with your OK we also use analytics and ad cookies to improve the shop. Change it any time via **Cookie settings** in the footer. Link: [Cookie Policy](/cookies).
   - **Buttons:** `Decline` (outline `lv-btn`) and `Accept all` (solid black `lv-btn`), equal size and equal prominence. A third text button, `Manage`, opens toggles for **Analytics** and **Marketing**, plus **Essential** (always on, disabled), with a `Save choices` button.
2. **Decline** means essential only. **Accept all** turns on analytics and marketing. The banner never reappears until the choice expires (**6 months**), or the cookie policy version changes (add a `CONSENT_VERSION` constant).
3. Store the choice in a first-party cookie `livus_consent` with value `{v, analytics, marketing, ts}`, `SameSite=Lax`, 180 days. Wrap all reads in try/catch.
4. **Footer:** add a "Cookie settings" link under the legal links. It reopens the banner in Manage mode.
5. **No scroll lock and no full-screen overlay.** The page stays usable. The banner must not cover the cart button or checkout's place-order button on mobile. Add bottom padding to the body while the banner is open, or keep the banner compact.
6. **Not shown** on `/admin/*`. It **is** shown on checkout, because checkout runs analytics events.
7. **The promo popup waits:** it must not open until the consent choice has been made (or on later visits). Never stack two dialogs.
8. **Accessibility:**
   - `role="dialog"`, `aria-labelledby`, focus the first button on open, `Esc` = close without choosing (it shows again next visit);
   - keyboard reachable, 44px tap targets.

### Analytics gating (the important part)
- GA4 and Meta Pixel scripts (`AnalyticsScripts.tsx`) must **not load at all** until the matching consent is true:
  - GA4 needs `analytics`;
  - Meta Pixel needs `marketing`.
- Use **Google Consent Mode v2**. Before any gtag loads, set `ad_storage`, `analytics_storage`, `ad_user_data` and `ad_personalization` to `denied`, then `gtag('consent','update',…)` on choice.
- `src/lib/analytics.ts` event helpers must no-op without consent.
- If the user changes the choice from granted to denied, stop sending events immediately. A full reload is OK to unload scripts.

### Content updates
- Update `cookiesPolicyText` in `src/content/policy-defaults.ts`:
  - describe the banner, the 3 categories, the 6-month expiry, and how to change your choice (the footer link);
  - list the real cookies: `livus_consent`, the Better Auth session cookie, the cart storage, and `_ga*` / `_fbp` only with consent.
  - Bump `POLICY_LAST_UPDATED`.
- The banner text should be editable in `/admin/content` (key `cookie_banner_text`), with the default above.

### Tests and checks
- A unit test for consent parse/serialize, version bump, and expiry.
- **Manual check (report it):** on first load, the Network tab shows **no** requests to `googletagmanager.com`, `google-analytics.com` or `connect.facebook.net` until Accept. After Decline, a reload still shows none.
  - Do this with test IDs on the Preview, or by temporarily setting dummy IDs locally. Never commit IDs.

---

## Agent A: About page redesign

Rebuild `/about` as a designed brand page, not a text page. Use a layout like gentlepark's About page, but in our style and with our sportswear voice. Everything must be **editable in admin**, and images must upload to Blob.

### Sections (top to bottom)
1. **Hero statement:**
   - A full-width section: a big `t-display` headline (2 lines max), e.g. "Built for sport. Made for Bangladesh.", plus one `t-lead` line under it.
   - An optional full-bleed image behind it or beside it (desktop 2-column, mobile stacked). If there's no image, use a black background with white text.
2. **Manifesto:**
   - One short uppercase paragraph (`t-eyebrow`-scale tracking, max ~60 words), centred, max-width ~880px. Generous vertical padding.
3. **Three pillars:**
   - A 3-column grid (stacks on mobile). Each pillar has an optional image (4:5), a `t-h3` title and 2 lines of `t-body`.
   - Default pillars: **Made to move** (fit and fabric for training), **Made for here** (heat, humidity, everyday wear), **Small drops** (limited runs, focused quality).
4. **Story block:**
   - A 2-column layout: an image on one side, text on the other. A big `t-h2` sentence plus a paragraph.
   - **The founding year shows only if the owner sets it.** Never use a placeholder.
5. **Why LIVUS:**
   - A 4-item row with an icon (lucide, 24px, stroke 1.5), a title and one line each.
   - Defaults: **Breathable fabrics**, **Athletic fit**, **Cash on Delivery, bKash & Nagad**, **Nationwide delivery**.
   - **No offers, no "free" anything.**
6. **Numbers row** (optional): up to 4 stats (value plus label).
   - **Hidden entirely unless the owner enters real numbers.** Never ship defaults like "50k+ customers".
7. **CTA:**
   - Two buttons: "Shop men's sportswear" → `/for-him`, "Shop women's sportswear" → `/for-her`.
   - Then the existing footer with the newsletter (`newsletter = true` stays on About).

### Data and admin
- Store everything as **one JSON value** in `site_content` key `about_layout`, with a Zod schema in `src/lib/about-layout.ts`. Use safe defaults and merge-with-defaults, like `site-profile.ts`.
- `/admin/content`: add an **"About page"** card with fields for every section:
  - text inputs and textareas with bold support;
  - image upload through the existing `/api/upload` → Blob, the same pattern as the popup page;
  - pillars and "why" items as fixed-count lists;
  - the stats list (0–4, empty = hidden);
  - a **show/hide switch per section**;
  - a "Preview page" link.
- Keep the old `about_page` text key working as a fallback: if `about_layout` is empty, the page still renders the old RichText version.

### Quality
- **SEO:**
  - one `<h1>` (the hero headline, or an sr-only "About LIVUS: Bangladeshi sportswear brand" if the headline doesn't contain the keyword);
  - pillars and the story use `<h2>`/`<h3>`;
  - keep the existing metadata;
  - images use `next/image` with `sizes` and real `alt`.
- **Performance:** only the hero image gets `priority`. Everything else lazy-loads. CLS ≈ 0 (fixed aspect ratios).
- **Mobile:** 375px with no horizontal scroll and readable line lengths. Desktop: content max-width matches other pages (`--lv-gutter`).
- **Copy:** use the sportswear brief from Round 8 §8.1 (coach voice, no invented facts, no "authentic/official/licensed", no offers). Reuse the current About text as the source.
- **Tests:** schema defaults and merge. Hidden sections don't render. Stats are hidden when empty.

---

## Report and stop
Write `docs/ROUND9_REPORT.md`:
- what was built, per agent, with commits;
- the network check result for the consent banner (before and after Accept);
- desktop and mobile screenshots of `/about` and the banner, saved under `docs/screens/round9/`;
- what the owner should add in admin: hero image, pillar images, story image, founding year, and stats if any.

**Stop.** Don't push to `main`.

---

## Paste-ready prompt

> Read `docs/HANDOFF_ANTIGRAVITY_ROUND9.md` fully and follow it. Run Agent K (cookie consent banner with real analytics gating and Consent Mode v2) and Agent A (About page redesign: layout like gentlepark's About page but in our design system and sportswear voice, fully editable in /admin/content with Blob image uploads) in parallel, on separate files. Never copy gentlepark's text or images. No offers in text, no fake stats or founding year, no visible scrollbars. Code only, test against `.env.test`, never push to main. Each agent commits separately with tsc, tests and build green. Write `docs/ROUND9_REPORT.md` with the network check and screenshots, then stop.
