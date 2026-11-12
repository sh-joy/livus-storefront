import { cache } from 'react';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// BD phone regex allowing optional +88 / 88 prefix and standard 11-digit operator numbering
const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

const phoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || bdPhoneRegex.test(val.replace(/[\s-]/g, '')),
    { message: 'Phone number must be a valid Bangladeshi number (e.g. 01711000000 or +8801711000000)' }
  );

const httpsUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === '' || val.startsWith('https://'),
    { message: 'URL must start with https://' }
  );

export const DEFAULT_BRAND = {
  name: 'LIVUS',
  tagline: 'Sportswear & Jerseys in Bangladesh',
  logoUrl: '',
  logoDarkUrl: '',
  faviconUrl: '',
};

export const DEFAULT_CONTACT = {
  email: '',
  phones: [] as string[],
  whatsapp: '',
  hours: 'Sat–Thu, 10 AM – 8 PM',
  address: 'House 24, Road 7, Dhanmondi, Dhaka 1205',
  mapUrl: '',
};

export const DEFAULT_SOCIAL = {
  facebook: 'https://www.facebook.com/livus.bd',
  instagram: 'https://www.instagram.com/livus.atelier',
  tiktok: '',
  youtube: '',
  x: '',
  linkedin: '',
};

export const DEFAULT_FOOTER = {
  about:
    'LIVUS is a Bangladeshi sportswear brand. We design jerseys, training tops and activewear for him and her in Dhaka, and deliver across Bangladesh.',
};

export const DEFAULT_SEO = {
  titleTemplate: '%s | LIVUS',
  defaultTitle: 'LIVUS | Sportswear & Jerseys in Bangladesh',
  defaultDescription:
    'Shop LIVUS sportswear, jerseys and activewear made to move in. Breathable training gear delivered nationwide across Bangladesh with Cash on Delivery.',
  shareImageUrl: '',
  keywords: [
    'LIVUS',
    'sportswear Bangladesh',
    'jerseys BD',
    'activewear',
    'gym wear',
    'online sportswear shop',
    'Cash on Delivery',
    'bKash',
    'Nagad',
  ],
  twitterHandle: '',
  googleVerification: '',
  facebookDomainVerification: '',
};

export const SiteProfileSchema = z.object({
  brand: z.object({
    name: z.string().trim().default(DEFAULT_BRAND.name),
    tagline: z.string().trim().default(DEFAULT_BRAND.tagline),
    logoUrl: httpsUrlSchema.default(DEFAULT_BRAND.logoUrl),
    logoDarkUrl: httpsUrlSchema.default(DEFAULT_BRAND.logoDarkUrl),
    faviconUrl: httpsUrlSchema.default(DEFAULT_BRAND.faviconUrl),
  }).default(DEFAULT_BRAND),
  contact: z.object({
    email: z.string().trim().email('Invalid email address').or(z.literal('')).default(DEFAULT_CONTACT.email),
    phones: z.array(phoneSchema).default(DEFAULT_CONTACT.phones),
    whatsapp: phoneSchema.default(DEFAULT_CONTACT.whatsapp),
    hours: z.string().trim().default(DEFAULT_CONTACT.hours),
    address: z.string().trim().default(DEFAULT_CONTACT.address),
    mapUrl: httpsUrlSchema.default(DEFAULT_CONTACT.mapUrl),
  }).default(DEFAULT_CONTACT),
  social: z.object({
    facebook: httpsUrlSchema.default(DEFAULT_SOCIAL.facebook),
    instagram: httpsUrlSchema.default(DEFAULT_SOCIAL.instagram),
    tiktok: httpsUrlSchema.default(DEFAULT_SOCIAL.tiktok),
    youtube: httpsUrlSchema.default(DEFAULT_SOCIAL.youtube),
    x: httpsUrlSchema.default(DEFAULT_SOCIAL.x),
    linkedin: httpsUrlSchema.default(DEFAULT_SOCIAL.linkedin),
  }).default(DEFAULT_SOCIAL),
  footer: z.object({
    about: z.string().trim().default(DEFAULT_FOOTER.about),
  }).default(DEFAULT_FOOTER),
  seo: z.object({
    titleTemplate: z.string().trim().default(DEFAULT_SEO.titleTemplate),
    defaultTitle: z.string().trim().default(DEFAULT_SEO.defaultTitle),
    defaultDescription: z.string().trim().default(DEFAULT_SEO.defaultDescription),
    shareImageUrl: httpsUrlSchema.default(DEFAULT_SEO.shareImageUrl),
    keywords: z.array(z.string().trim()).default(DEFAULT_SEO.keywords),
    twitterHandle: z.string().trim().default(DEFAULT_SEO.twitterHandle),
    googleVerification: z.string().trim().default(DEFAULT_SEO.googleVerification),
    facebookDomainVerification: z.string().trim().default(DEFAULT_SEO.facebookDomainVerification),
  }).default(DEFAULT_SEO),
});

export type SiteProfile = z.infer<typeof SiteProfileSchema>;

export const DEFAULT_SITE_PROFILE: SiteProfile = SiteProfileSchema.parse({});

/**
 * Deep merge partial profile JSON over base defaults.
 */
export function mergeSiteProfile(savedJson?: unknown, fallbackSettings?: { email?: string; phone?: string }): SiteProfile {
  const base = { ...DEFAULT_SITE_PROFILE };
  let raw: any = {};
  if (savedJson && typeof savedJson === 'object') {
    raw = savedJson;
  } else if (typeof savedJson === 'string' && savedJson.trim()) {
    try {
      raw = JSON.parse(savedJson);
    } catch {
      raw = {};
    }
  }

  // Fallback email and phone from storeSettings if not provided in raw
  const defaultEmail = fallbackSettings?.email || 'support@livus.com.bd';
  const defaultPhones = fallbackSettings?.phone ? [fallbackSettings.phone] : [];

  const merged = {
    brand: { ...base.brand, ...(raw.brand || {}) },
    contact: {
      ...base.contact,
      email: raw.contact?.email ?? (defaultEmail || base.contact.email),
      phones: Array.isArray(raw.contact?.phones)
        ? raw.contact.phones
        : (defaultPhones.length > 0 ? defaultPhones : base.contact.phones),
      ...(raw.contact || {}),
    },
    social: { ...base.social, ...(raw.social || {}) },
    footer: { ...base.footer, ...(raw.footer || {}) },
    seo: {
      ...base.seo,
      keywords: Array.isArray(raw.seo?.keywords) ? raw.seo.keywords : base.seo.keywords,
      ...(raw.seo || {}),
    },
  };

  const parsed = SiteProfileSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

/**
 * Server-only cached reader for the current site profile.
 * Falls back safely to defaults and store_settings when the table is not migrated yet.
 */
export const getSiteProfile = cache(async (): Promise<SiteProfile> => {
  let savedString: string | null = null;
  let fallbackSettings: { email?: string; phone?: string } = {};

  try {
    const { db } = await import('@/db');
    const { siteContent, storeSettings } = await import('@/db/schema');
    if (db) {
      const row = await db.query.siteContent.findFirst({
        where: eq(siteContent.key, 'site_profile'),
      });
      if (row?.value) {
        savedString = row.value;
      }

      // Read fallback store settings
      const settingsRow = await db.query.storeSettings.findFirst({
        where: eq(storeSettings.id, 'general'),
      });
      if (settingsRow) {
        fallbackSettings = {
          email: settingsRow.supportEmail || undefined,
          phone: settingsRow.supportPhone || undefined,
        };
      }
    }
  } catch (err) {
    // Database table missing, DB client not configured, or connection offline; use fallback defaults
  }

  return mergeSiteProfile(savedString, fallbackSettings);
});
