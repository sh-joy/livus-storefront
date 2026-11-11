# LIVUS: Google Search Console, Analytics & SEO Owner Guide

This guide walks you through setting up Google Search Console, Google Analytics 4, Meta Pixel, and verifying your store's search appearance. Everything is already built into your LIVUS store — you only need to follow these simple steps.

---

## 1. Add LIVUS to Google Search Console (GSC)

Google Search Console ensures Google indexes your products, categories, and policies, and reports any crawl issues.

### Step 1: Open Search Console
1. Go to [https://search.google.com/search-console](https://search.google.com/search-console) and sign in with your Google Account.
2. In the top-left property dropdown, select **Add property**.
3. Choose **URL prefix** (recommended for quick verification):
   - Enter your live URL: `https://mylivus.vercel.app` (or your custom domain once connected).
   - Click **Continue**.

### Step 2: Verify Ownership via HTML Tag
1. In the verification methods popup, expand the **HTML tag** option.
2. You will see a meta tag like:
   ```html
   <meta name="google-site-verification" content="abcdef1234567890..." />
   ```
3. Copy **only the content code** (the letters/numbers between quotes).
4. Go to your LIVUS Admin dashboard:
   - Navigate to `/admin/site` -> **Search & Verification** section.
   - Paste the code into the **Google Search Console Verification Token** field.
   - Click **Save Profile**.
5. Return to Google Search Console and click **Verify**. You will see a green checkmark confirming verification.

---

## 2. Submit Your Sitemap to Google

Submitting your sitemap instructs Google to immediately discover and index all your products and pages.

1. In Google Search Console, click **Sitemaps** in the left sidebar under *Indexing*.
2. Under **Add a new sitemap**, type:
   ```
   sitemap.xml
   ```
3. Click **Submit**.
4. The status will update to **Success** within a few minutes or hours. Your active products, category pages, and policies are now queued for crawling.

---

## 3. Verify Rich Results (Product Cards in Google Search)

LIVUS automatically embeds Google-compliant Product structured data (JSON-LD), including currency (BDT), real availability, pricing, return policies (7-day window), and shipping fees.

### How to test:
1. Go to [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results).
2. Enter any product URL (e.g. `https://mylivus.vercel.app/product/grey-textured-crepe-two-piece`).
3. Click **Test URL**.
4. You will see green checkmarks for:
   - **Product snippets**: Price, availability (In stock), brand (LIVUS), SKU, images.
   - **Merchant listings**: Shipping details and return policy.

---

## 4. Setting up Google Analytics 4 (GA4)

1. Go to [https://analytics.google.com](https://analytics.google.com) and create a property named **LIVUS**.
2. Under Data Streams, select **Web** and enter your store URL (`https://mylivus.vercel.app`).
3. Copy your **Measurement ID** (starts with `G-`, e.g., `G-XXXXXXXXXX`).
4. In your Vercel Project Settings (or admin settings), add the environment variable:
   - Name: `NEXT_PUBLIC_GA_ID`
   - Value: `G-XXXXXXXXXX`
5. The store automatically logs page views and route transitions with zero impact on page speed (`strategy="lazyOnload"`).

---

## 5. Setting up Meta Pixel (Facebook & Instagram Ads)

1. Go to [Meta Events Manager](https://eventsmanager.facebook.com).
2. Create or select your Pixel for **LIVUS**.
3. Copy your **Pixel ID** (a 15–16 digit number).
4. In your Vercel Project Settings, add the environment variable:
   - Name: `NEXT_PUBLIC_META_PIXEL_ID`
   - Value: `<your-pixel-id>`
5. *(Optional domain verification)*: In Meta Business Settings -> Brand Safety -> Domains, copy your verification code, and paste it into `/admin/site` under **Facebook Domain Verification**.

---

## 6. What to Expect After Launch

- **Initial Crawl**: Google typically crawls and indexes your homepage and main categories within 24 to 72 hours of sitemap submission.
- **Core Web Vitals**: Google Search Console requires real-user traffic to display Core Web Vitals (LCP, INP, CLS). Real-user data starts showing up in Search Console approximately **28 days** after you receive steady visitor traffic.
- **Editing Page Content**: Whenever you edit category intro text or policies in `/admin/content`, your changes go live immediately and refresh search snippet copy on the next crawl.
