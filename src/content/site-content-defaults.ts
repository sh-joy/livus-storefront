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
  heading: 'Built for sport.\nMade for Bangladesh.',
  text: 'Get first access to new jersey drops, restocks and team releases. No spam — unsubscribe any time.',
  buttonLabel: 'Subscribe',
  imageUrl: '/figma-assets/71b3cd582dab7174e13346a8d88abe33548d2aa7.png',
};

export const DEFAULT_CONTENT: Record<SiteContentKey, string> = {
  about_page: [
    '**Built for sport.**',
    'LIVUS is a Bangladeshi sportswear brand made for people who play, train and move. Founded in [OWNER: founding year, e.g. 2024], we build match-day jerseys, training tops and activewear for the pitch, the gym, the court and the street. We believe athletic apparel should work when you train hard and still look sharp when you walk out.',
    '**Made for here.**',
    'Playing sport in Bangladesh means facing heat, humidity and sudden rain. We choose lightweight, breathable fabrics [OWNER: specific fabric blend or mill] that pull sweat away from your skin and dry fast. Our cuts are athletic but comfortable, tested on local athletes so you get an honest fit on match day and rest days alike.',
    '**How we make it.**',
    "We produce in small batches with trusted manufacturing partners in [OWNER: factory location, e.g. Gazipur / Narayanganj]. Every seam, collar and rib is built to handle repeated wash and wear without losing shape. Releasing limited runs keeps quality tight and ensures you wear something distinct. Explore our latest drops in [men's sportswear](/for-him), [women's sportswear](/for-her), and [new sportswear arrivals](/latest).",
    '**Join the team.**',
    'Sport brings people together across Bangladesh. Follow our journey on social media, join our training community, and subscribe to our newsletter for first word on new drops and restocks. Train hard, move free.',
  ].join('\n\n'),

  privacy_page: '', // Computed dynamically with getPolicyContext()
  terms_page: '', // Computed dynamically with getPolicyContext()
  shipping_page: '', // Computed dynamically with getPolicyContext()
  cookies_page: '', // Computed dynamically with getPolicyContext()

  contact_intro:
    'Have a question about an order, sizing or delivery, or want to share feedback? Send us a message or reach us through any of the channels below. We are happy to help.',

  contact_faqs: JSON.stringify(DEFAULT_FAQS),

  home_collection_text:
    'Performance jerseys, training tops and activewear made to move in Bangladesh. Built for the pitch, the gym and the street.',

  newsletter_cta: JSON.stringify(DEFAULT_NEWSLETTER_CTA),

  shipping_returns: '', // Built dynamically with storeSettings

  category_for_him_intro:
    "Men's sportswear in Bangladesh built for match-day intensity and daily training. Breathable jerseys, athletic tops and gym wear made for our heat. Also explore our [unisex sportswear](/unisex) for relaxed fits.",

  category_for_her_intro:
    "Women's sportswear in Bangladesh designed for training, movement and everyday active style. Light, breathable activewear and sports tops made to keep you cool. Also explore our [unisex sportswear](/unisex) collection.",

  category_unisex_intro:
    "Unisex sportswear made for everyone who plays, trains and moves. Relaxed athletic cuts and sports tees built for easy layering and everyday wear. Pair them with our [sports accessories](/accessories).",

  category_accessories_intro:
    "Sports accessories in Bangladesh to complete your look on and off the field. Practical athletic essentials engineered for daily training. Check out our latest [men's sportswear](/for-him) and [women's sportswear](/for-her).",
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
