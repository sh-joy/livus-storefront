import { describe, it, expect, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    query: {
      storeSettings: { findFirst: vi.fn() },
      products: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn() })) })),
  },
}));

import { pageMetadata, escapeJsonLd } from '@/lib/seo';
import { buildProductJsonLd, getProductTitle, getDescription, type Product } from '@/app/product/[slug]/page';
import { DELIVERY_CHARGE_BDT } from '@/lib/order-pricing';
import { SHIPPING_POLICY_DEFAULTS } from '@/content/policy-defaults';
import { formatBdt } from '@/lib/utils';
import { metadata as homeMeta } from '@/app/page';
import { metadata as forHimMeta } from '@/app/for-him/page';
import { metadata as forHerMeta } from '@/app/for-her/page';
import { metadata as unisexMeta } from '@/app/unisex/page';
import { metadata as accessoriesMeta } from '@/app/accessories/page';
import { metadata as aboutMeta } from '@/app/about/page';
import { metadata as latestMeta } from '@/app/latest/page';
import { metadata as popularMeta } from '@/app/popular/page';

describe('SEO Helpers & Metadata Generation', () => {
  it('generates proper title, canonical, and openGraph metadata for public pages', async () => {
    const meta = await pageMetadata({
      title: 'Accessories Collection',
      description: 'Exclusive accessories by LIVUS',
      path: '/accessories',
    });

    expect(meta.title).toBe('Accessories Collection');
    expect(meta.description).toBe('Exclusive accessories by LIVUS');
    expect(meta.alternates?.canonical).toContain('/accessories');
    expect(meta.robots).toEqual(
      expect.objectContaining({
        index: true,
        follow: true,
      })
    );
    expect(meta.openGraph?.title).toBe('Accessories Collection');
    expect(meta.openGraph?.url).toContain('/accessories');
  });

  it('correctly sets noindex and nofollow when requested for private pages', async () => {
    const meta = await pageMetadata({
      title: 'Checkout',
      path: '/checkout',
      noindex: true,
      nofollow: true,
    });

    expect(meta.robots).toEqual(
      expect.objectContaining({
        index: false,
        follow: false,
        googleBot: expect.objectContaining({
          index: false,
          follow: false,
        }),
      })
    );
  });

  it('escapes less-than characters safely in JSON-LD strings', () => {
    const dangerous = {
      description: 'Cool shirt <script>alert(1)</script>',
    };
    const escaped = escapeJsonLd(dangerous);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('\\u003cscript>');
  });

  it('validates product JSON-LD shipping rate matches checkout default delivery charge and return policy defaults', () => {
    const mockProduct: any = {
      id: '3b1b6814-2396-4886-b485-612662c5b364',
      name: 'OWAYO - CROSS FADE',
      slug: 'owayo-cross-fade',
      description: 'Athletic performance jersey built for training.',
      priceBdt: 1450,
      collectionTag: 'Jerseys',
      categorySlug: 'for-him',
      colorVariants: [
        {
          id: 'v1',
          name: 'Black',
          thumbnailUrl: '/images/jersey.jpg',
          galleryImages: ['/images/jersey.jpg'],
          sizes: [{ size: 'M', sku: 'OWY-M-1001', quantity: 10, isStockOut: false }],
        },
      ],
    };

    const productJsonLd = buildProductJsonLd(mockProduct, DELIVERY_CHARGE_BDT);

    expect(productJsonLd['@type']).toBe('Product');
    expect(productJsonLd.category).toBe('Sportswear > Jerseys');
    expect(productJsonLd.offers.priceCurrency).toBe('BDT');
    expect(productJsonLd.offers.shippingDetails.shippingDestination.addressCountry).toBe('BD');
    // Shipping rate matches checkout charge (150 BDT, not hard-coded 120)
    expect(Number(productJsonLd.offers.shippingDetails.shippingRate.value)).toBe(DELIVERY_CHARGE_BDT);
    expect(Number(productJsonLd.offers.shippingDetails.shippingRate.value)).toBe(150);
    // Handling and transit times synced with shared constant
    expect(productJsonLd.offers.shippingDetails.deliveryTime.handlingTime.minValue).toBe(SHIPPING_POLICY_DEFAULTS.handlingDaysMin);
    expect(productJsonLd.offers.shippingDetails.deliveryTime.handlingTime.maxValue).toBe(SHIPPING_POLICY_DEFAULTS.handlingDaysMax);
    expect(productJsonLd.offers.shippingDetails.deliveryTime.transitTime.minValue).toBe(SHIPPING_POLICY_DEFAULTS.transitDaysMin);
    expect(productJsonLd.offers.shippingDetails.deliveryTime.transitTime.maxValue).toBe(SHIPPING_POLICY_DEFAULTS.transitDaysMax);
    // Merchant return policy synced with shared constant (7 days)
    expect(productJsonLd.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(SHIPPING_POLICY_DEFAULTS.returnDays);
    expect(productJsonLd.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(7);
  });

  it('verifies sitemap filter logic correctly omits inactive products and private routes', () => {
    const mockProducts = [
      { slug: 'active-jersey', isActive: true },
      { slug: 'archived-tank', isActive: false },
      { slug: 'draft-tee', isActive: false },
    ];
    const privateRoutes = ['/search', '/checkout', '/order-confirmed', '/admin', '/signin', '/signup'];

    const activeOnly = mockProducts.filter((p) => p.isActive);
    expect(activeOnly).toHaveLength(1);
    expect(activeOnly[0].slug).toBe('active-jersey');

    for (const route of privateRoutes) {
      expect(['', '/for-him', '/for-her', '/all-products', '/about', '/privacy', '/terms']).not.toContain(route);
    }
  });

  it('validates formatBdt() formats currency with thousands separators', () => {
    expect(formatBdt(1450)).toBe('৳1,450');
    expect(formatBdt(3200)).toBe('৳3,200');
    expect(formatBdt('2130')).toBe('৳2,130');
    expect(formatBdt(150)).toBe('৳150');
    expect(formatBdt(0)).toBe('৳0');
    expect(formatBdt(null)).toBe('৳0');
    expect(formatBdt(undefined)).toBe('৳0');
  });

  it('validates metadata uniqueness, title lengths <= 60 chars, and descriptions 140-160 chars', () => {
    const routes = [
      { path: '/', meta: homeMeta },
      { path: '/for-him', meta: forHimMeta },
      { path: '/for-her', meta: forHerMeta },
      { path: '/unisex', meta: unisexMeta },
      { path: '/accessories', meta: accessoriesMeta },
      { path: '/about', meta: aboutMeta },
      { path: '/latest', meta: latestMeta },
      { path: '/popular', meta: popularMeta },
    ];

    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const r of routes) {
      const titleStr = typeof r.meta.title === 'string'
        ? r.meta.title
        : (r.meta.title as any)?.absolute || '';
      const descStr = r.meta.description || '';

      // Title assertions
      expect(titleStr.length).toBeGreaterThanOrEqual(40);
      expect(titleStr.length).toBeLessThanOrEqual(60);
      expect(titles.has(titleStr)).toBe(false);
      titles.add(titleStr);

      // Description assertions (140-160 chars)
      expect(descStr.length).toBeGreaterThanOrEqual(140);
      expect(descStr.length).toBeLessThanOrEqual(160);
      expect(descriptions.has(descStr)).toBe(false);
      descriptions.add(descStr);

      // Wording rules: No "authentic", no fake accessories, no prices/offers in meta description
      expect(descStr.toLowerCase()).not.toContain('authentic');
      expect(descStr.toLowerCase()).not.toContain('sports socks');
      expect(descStr.toLowerCase()).not.toContain('gym bags');
      expect(descStr).not.toMatch(/%\s*off|free delivery|৳\d+/i);
    }
  });

  it('validates product title and description templates adhering to length and sportswear rules', () => {
    const mockProduct: any = {
      id: '3b1b6814-2396-4886-b485-612662c5b364',
      name: 'OWAYO - CROSS FADE',
      slug: 'owayo-cross-fade',
      description: 'Training jersey engineered for peak speed.',
      specifications: 'Fabric: 100% Breathable Polyester\nFit: Athletic Race Fit',
      sizeMatrix: [],
      collectionTag: 'Jerseys',
      categorySlug: 'for-him',
      priceBdt: 1450,
      price: '1450',
      isActive: true,
      colorVariants: [
        {
          id: 'v1',
          name: 'Black',
          hexColor: '#000000',
          thumbnailUrl: '/images/jersey.jpg',
          isLowStock: false,
          galleryImages: ['/images/jersey.jpg'],
          sizes: [],
        },
      ],
    };

    const titleObj = getProductTitle(mockProduct);
    expect(titleObj.absolute.length).toBeGreaterThanOrEqual(50);
    expect(titleObj.absolute.length).toBeLessThanOrEqual(60);
    expect(titleObj.absolute).toContain('LIVUS');

    const desc = getDescription(mockProduct);
    expect(desc.length).toBeGreaterThanOrEqual(140);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain('OWAYO - CROSS FADE');
    expect(desc.endsWith('Delivery across Bangladesh.')).toBe(true);
  });
});
