import { describe, it, expect } from 'vitest';
import {
  SITE_CONTENT_KEYS,
  getDefaultSiteContent,
} from '@/content/site-content-defaults';
import {
  privacyPolicyText,
  termsText,
  shippingReturnsText,
  cookiesPolicyText,
  POLICY_LAST_UPDATED,
} from '@/content/policy-defaults';

describe('Site Content & Policy Defaults', () => {
  it('includes all standard keys including cookies_page', () => {
    expect(SITE_CONTENT_KEYS).toContain('cookies_page');
    expect(SITE_CONTENT_KEYS).toContain('privacy_page');
    expect(SITE_CONTENT_KEYS).toContain('terms_page');
    expect(SITE_CONTENT_KEYS).toContain('shipping_page');
    expect(SITE_CONTENT_KEYS).toContain('contact_faqs');
  });

  it('renders rich policy defaults with store context', () => {
    const ctx = {
      storeName: 'LIVUS',
      supportEmail: 'support@livus.com.bd',
      supportPhone: '+880 1711 000000',
      deliveryFeeBdt: 150,
      freeDeliveryOverBdt: 2500,
    };

    const privacy = privacyPolicyText(ctx);
    expect(privacy).toContain(POLICY_LAST_UPDATED);
    expect(privacy).toContain('LIVUS');
    expect(privacy).toContain('**1. Information we collect**');

    const terms = termsText(ctx);
    expect(terms).toContain(POLICY_LAST_UPDATED);
    expect(terms).toContain('LIVUS');
    expect(terms).toContain('**1. About us**');

    const shipping = shippingReturnsText(ctx);
    expect(shipping).toContain('৳150');
    expect(shipping).not.toMatch(/free delivery/i); // offers never go in policy text
    expect(shipping).toContain('**Delivery**');

    const cookies = cookiesPolicyText(ctx);
    expect(cookies).toContain(POLICY_LAST_UPDATED);
    expect(cookies).toContain('**1. What cookies are**');
  });

  it('resolves default content for policy keys dynamically', async () => {
    const priv = await getDefaultSiteContent('privacy_page');
    expect(priv).toContain('Information we collect');

    const terms = await getDefaultSiteContent('terms_page');
    expect(terms).toContain('About us');

    const ship = await getDefaultSiteContent('shipping_page');
    expect(ship).toContain('Delivery');

    const cookies = await getDefaultSiteContent('cookies_page');
    expect(cookies).toContain('What cookies are');
  });
});
