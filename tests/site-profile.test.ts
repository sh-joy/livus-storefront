import { describe, it, expect } from 'vitest';
import {
  SiteProfileSchema,
  DEFAULT_SITE_PROFILE,
  mergeSiteProfile,
} from '@/lib/site-profile';

describe('Site Profile Data Model & Validation', () => {
  it('provides safe defaults when input is empty', () => {
    const profile = mergeSiteProfile({});
    expect(profile.brand.name).toBe('LIVUS');
    expect(profile.brand.tagline).toBe('Athletic Streetwear & Jerseys');
    expect(profile.contact.email).toBe('support@livus.com.bd');
    expect(profile.contact.hours).toBe('Sat–Thu, 10 AM – 8 PM');
    expect(profile.social.facebook).toBe('https://www.facebook.com/livus.bd');
    expect(profile.seo.titleTemplate).toBe('%s | LIVUS');
    expect(profile.seo.defaultTitle).toContain('LIVUS');
  });

  it('correctly merges partial JSON over base defaults', () => {
    const partial = {
      brand: {
        name: 'LIVUS Studio',
        logoUrl: 'https://example.com/logo.png',
      },
      contact: {
        whatsapp: '01712345678',
      },
      seo: {
        twitterHandle: '@livusbd',
      },
    };

    const merged = mergeSiteProfile(partial);
    // Overwritten fields
    expect(merged.brand.name).toBe('LIVUS Studio');
    expect(merged.brand.logoUrl).toBe('https://example.com/logo.png');
    expect(merged.contact.whatsapp).toBe('01712345678');
    expect(merged.seo.twitterHandle).toBe('@livusbd');

    // Untouched fields maintain defaults
    expect(merged.brand.tagline).toBe('Athletic Streetwear & Jerseys');
    expect(merged.contact.email).toBe('support@livus.com.bd');
    expect(merged.social.facebook).toBe('https://www.facebook.com/livus.bd');
  });

  it('uses fallback settings from store_settings when contact fields are not set', () => {
    const merged = mergeSiteProfile({}, { email: 'custom@livus.com', phone: '01811223344' });
    expect(merged.contact.email).toBe('custom@livus.com');
    expect(merged.contact.phones).toEqual(['01811223344']);
  });

  it('rejects invalid non-https URLs', () => {
    const invalidUrl = {
      brand: {
        logoUrl: 'http://insecure.com/logo.png',
      },
    };
    const res = SiteProfileSchema.safeParse(invalidUrl);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('https://');
    }
  });

  it('rejects invalid phone numbers that do not match Bangladeshi regex', () => {
    const invalidPhone = {
      contact: {
        phones: ['123456'],
      },
    };
    const res = SiteProfileSchema.safeParse(invalidPhone);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('valid Bangladeshi number');
    }
  });

  it('accepts valid Bangladeshi phone numbers with +88 or without', () => {
    const validPhones = {
      contact: {
        phones: ['01711223344', '+8801911223344', '8801811223344'],
        whatsapp: '01611223344',
      },
    };
    const res = SiteProfileSchema.safeParse(validPhones);
    expect(res.success).toBe(true);
  });
});
