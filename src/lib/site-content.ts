import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { storeSettings } from '@/db/schema';

export const SITE_CONTENT_KEYS = [
  'shipping_returns',
  'about_page',
  'privacy_page',
  'terms_page',
  'shipping_page',
  'contact_intro',
  'contact_faqs',
  'home_collection_text',
  'newsletter_cta',
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
    a: 'Delivery starts from ৳150 and depends on your district. You always see the exact charge at checkout before you confirm. Orders of ৳2,500 or more get free delivery.',
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

  privacy_page: [
    'At LIVUS Atelier, we respect your personal privacy. When you browse our collections, place an order, or subscribe to our newsletter, we collect necessary data including your name, delivery address, phone number, and transaction references.',
    '**Information Security:**\nAll sensitive information is processed over encrypted SSL connections. We never share, sell, or rent your personal contact information to third-party marketing companies.',
    '**Payment Verification:**\nFor bKash and Nagad manual transactions, Transaction IDs and sender phone numbers are used exclusively by our financial verification desk to reconcile orders.',
  ].join('\n\n'),

  terms_page: [
    'Welcome to LIVUS. By placing an order through our storefront or contacting our team, you agree to the terms outlined below.',
    '**Pricing & Payment:**\nAll prices are listed in Bangladeshi Taka (BDT) inclusive of applicable VAT. Payment methods accepted include Cash on Delivery (COD) and manual bKash/Nagad transfers with valid TrxIDs.',
    '**Order Acceptance & Stock:**\nOrders are subject to item availability. While items in your bag reserve temporary inventory, orders may be cancelled if payment verification fails or fraud is suspected.',
  ].join('\n\n'),

  shipping_page: [
    '**Delivery Rates & Speed:**\n- **Dhaka Division:** ৳100 BDT flat delivery (delivered within 24 to 48 hours).\n- **All Other Divisions:** ৳150 BDT flat delivery (delivered within 48 to 72 hours).\n- **Free Shipping:** Automatically applied to all orders with an apparel subtotal of ৳2,500 BDT or more.',
    '**7-Day Exchanges:**\nWe accept size and item exchanges within 7 days of delivery, provided the garment is unworn, unwashed, and retains all original tags.',
  ].join('\n\n'),

  contact_intro:
    'Have a question about an order, sizing or delivery, or want to share feedback? Send us a message or reach us through any of the channels below. We are happy to help.',

  contact_faqs: JSON.stringify(DEFAULT_FAQS),

  home_collection_text:
    'Our most-loved jerseys, shirts and everyday athletic wear right now. New styles land with every drop.',

  newsletter_cta: JSON.stringify(DEFAULT_NEWSLETTER_CTA),

  shipping_returns: '', // Built dynamically with storeSettings
};

/** Default product-page shipping text, built from the current fees and free-delivery setting. */
export async function defaultShippingText(): Promise<string> {
  let fee = 150;
  let freeOver = 0;
  try {
    if (db) {
      const s = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
      if (s) {
        fee = s.defaultDeliveryChargeBdt ?? fee;
        freeOver = s.freeShippingThresholdBdt ?? 0;
      }
    }
  } catch {
    /* use defaults */
  }
  return [
    `**Nationwide delivery:** 2–3 working days inside Dhaka and 3–5 working days across the rest of Bangladesh. Delivery starts from ৳${fee} and the exact charge is shown at checkout.`,
    freeOver > 0 ? `**Free delivery:** on orders of ৳${freeOver.toLocaleString()} or more.` : '',
    '**Easy 7-day exchange:** size or fit not right? Exchange unworn items with the original tags within 7 days.',
  ]
    .filter(Boolean)
    .join('\n\n');
}
