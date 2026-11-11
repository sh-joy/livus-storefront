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
});
