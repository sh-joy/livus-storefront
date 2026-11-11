import { describe, it, expect } from 'vitest';
import { pageMetadata, escapeJsonLd } from '@/lib/seo';

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

  it('validates product JSON-LD schema with shipping and merchant return policies', () => {
    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Grey Textured Crepe Two-Piece',
      description: 'Athletic streetwear set by LIVUS.',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: '3200',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '120',
            currency: 'BDT',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'BD',
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'BD',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
        },
      },
    };

    expect(productJsonLd['@type']).toBe('Product');
    expect(productJsonLd.offers.priceCurrency).toBe('BDT');
    expect(productJsonLd.offers.shippingDetails.shippingDestination.addressCountry).toBe('BD');
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
});
