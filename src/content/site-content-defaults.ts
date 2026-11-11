import { eq } from 'drizzle-orm';
import {
  privacyPolicyText,
  termsText,
  shippingReturnsText,
  cookiesPolicyText,
  type PolicyContext,
} from '@/content/policy-defaults';

export const SITE_CONTENT_KEYS = [
  'shipping_returns',
  'about_page',
  'privacy_page',
  'terms_page',
  'shipping_page',
  'cookies_page',
  'contact_intro',
  'contact_faqs',
  'home_collection_text',
  'newsletter_cta',
  'category_for_him_intro',
  'category_for_her_intro',
  'category_unisex_intro',
  'category_accessories_intro',
] as const;

export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];

export interface FaqItem {
  q: string;
  a: string;
}

export interface NewsletterCtaConfig {
  heading: string;
  text: string;
  buttonLabel: string;
  imageUrl: string;
}

export const DEFAULT_FAQS: FaqItem[] = [
  {
    q: 'How do I place an order?',
    a: 'Choose your product, pick a colour and size, and add it to your cart. Then go to checkout, fill in your delivery details and confirm. Our team calls you to confirm the order before it is dispatched.',
  },
  {
    q: 'How much does delivery cost?',
    a: 'Delivery starts from ৳150 and depends on your district. You always see the exact charge at checkout before you confirm.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders inside Dhaka usually arrive within 2–3 working days, and within 3–5 working days for the rest of Bangladesh.',
  },
  {
    q: 'How can I pay?',
    a: 'You can pay cash on delivery anywhere in Bangladesh. When bKash or Nagad are available they are shown as options at checkout.',
  },
  {
    q: 'How do I exchange or return an item?',
    a: 'We accept exchanges within 7 days of delivery for unworn, unwashed items with the original tags attached. Send us a message with your order ID and we will arrange it.',
  },
  {
    q: 'How do I track my order?',
    a: 'Enter your order number (for example LIV-123456) on the My Account page to see its status. You will find the number on your order confirmation.',
  },
];

export const DEFAULT_NEWSLETTER_CTA: NewsletterCtaConfig = {
  heading: 'Made for the game.\nBuilt for the street.',
  text: 'New drops, restocks and members-only offers first. No spam — unsubscribe any time.',
  buttonLabel: 'Subscribe',
  imageUrl: '/figma-assets/71b3cd582dab7174e13346a8d88abe33548d2aa7.png',
};

export const DEFAULT_CONTENT: Record<SiteContentKey, string> = {
  about_page: [
    'LIVUS is a contemporary Bangladeshi streetwear atelier focused on architectural silhouettes, heavy cotton fabrications, and minimalist luxury.',
    'Designed in Dhaka, our pieces bridge functional sports performance with runway aesthetic standards.',
  ].join('\n\n'),

  privacy_page: '', // Computed dynamically with getPolicyContext()
  terms_page: '', // Computed dynamically with getPolicyContext()
  shipping_page: '', // Computed dynamically with getPolicyContext()
  cookies_page: '', // Computed dynamically with getPolicyContext()

  contact_intro:
    'Have a question about an order, sizing or delivery, or want to share feedback? Send us a message or reach us through any of the channels below. We are happy to help.',

  contact_faqs: JSON.stringify(DEFAULT_FAQS),

  home_collection_text:
    'Our most-loved jerseys, shirts and everyday athletic wear right now. New styles land with every drop.',

  newsletter_cta: JSON.stringify(DEFAULT_NEWSLETTER_CTA),

  shipping_returns: '', // Built dynamically with storeSettings

  category_for_him_intro:
    'Engineered athletic wear, training jerseys and relaxed streetwear tees for men. Designed in Dhaka and delivered across Bangladesh.',

  category_for_her_intro:
    'Comfort-first athletic streetwear, versatile oversized tops and performance jerseys for women. Designed in Dhaka and delivered across Bangladesh.',

  category_unisex_intro:
    'Contemporary unisex athletic streetwear and casual jerseys designed for an effortless fit. Delivered nationwide across Bangladesh.',

  category_accessories_intro:
    'Athletic lifestyle essentials, sports caps and gear to complete your streetwear look. Delivered nationwide across Bangladesh.',
};

/** Build policy context dynamically from site profile with fallback to storeSettings */
export async function getPolicyContext(): Promise<PolicyContext> {
  let storeName = 'LIVUS';
  let supportEmail = 'support@livus.com.bd';
  let supportPhone = '';
  let deliveryFeeBdt = 150;
  let freeDeliveryOverBdt = 0;

  try {
    const { getSiteProfile } = await import('@/lib/site-profile');
    const profile = await getSiteProfile();
    if (profile.brand?.name) storeName = profile.brand.name;
    if (profile.contact?.email) supportEmail = profile.contact.email;
    if (profile.contact?.phones?.[0]) supportPhone = profile.contact.phones[0];
  } catch {
    /* fallback to storeSettings or defaults */
  }

  try {
    const { db } = await import('@/db');
    const { storeSettings } = await import('@/db/schema');
    if (db) {
      const s = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
      if (s) {
        if (!supportEmail && s.supportEmail) supportEmail = s.supportEmail;
        if (!supportPhone && s.supportPhone) supportPhone = s.supportPhone;
        if (s.defaultDeliveryChargeBdt != null) deliveryFeeBdt = s.defaultDeliveryChargeBdt;
        if (s.freeShippingThresholdBdt != null) freeDeliveryOverBdt = s.freeShippingThresholdBdt;
      }
    }
  } catch {
    /* use defaults */
  }

  return { storeName, supportEmail, supportPhone, deliveryFeeBdt, freeDeliveryOverBdt };
}

/** Default product-page shipping text, built from the current delivery fee. Offers (free delivery etc.) are never written here. */
export async function defaultShippingText(): Promise<string> {
  let fee = 150;
  try {
    const { db } = await import('@/db');
    const { storeSettings } = await import('@/db/schema');
    if (db) {
      const s = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
      if (s) {
        fee = s.defaultDeliveryChargeBdt ?? fee;
      }
    }
  } catch {
    /* use defaults */
  }
  return [
    `**Nationwide delivery:** 2–3 working days inside Dhaka and 3–5 working days across the rest of Bangladesh. Delivery starts from ৳${fee} and the exact charge is shown at checkout.`,
    '**Easy 7-day exchange:** size or fit not right? Exchange unworn items with the original tags within 7 days.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Compute default site content for any key */
export async function getDefaultSiteContent(key: SiteContentKey): Promise<string> {
  if (key === 'shipping_returns') {
    return await defaultShippingText();
  }
  if (key === 'privacy_page') {
    const ctx = await getPolicyContext();
    return privacyPolicyText(ctx);
  }
  if (key === 'terms_page') {
    const ctx = await getPolicyContext();
    return termsText(ctx);
  }
  if (key === 'shipping_page') {
    const ctx = await getPolicyContext();
    return shippingReturnsText(ctx);
  }
  if (key === 'cookies_page') {
    const ctx = await getPolicyContext();
    return cookiesPolicyText(ctx);
  }
  return DEFAULT_CONTENT[key] ?? '';
}
