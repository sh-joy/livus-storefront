/**
 * Safe client-side analytics helpers for Meta Pixel and Google Analytics 4 (GA4).
 * All methods safely no-op when running on the server or when tracking IDs/scripts are absent.
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export interface AnalyticsItem {
  id: string;
  name: string;
  price: number | string;
  quantity?: number;
  size?: string;
  category?: string;
}

function parsePrice(raw: number | string): number {
  if (typeof raw === 'number') return raw;
  return parseFloat(String(raw).replace(/[^0-9.]/g, '')) || 0;
}

/**
 * 1. Product Page Viewed
 * Meta Pixel: ViewContent
 * GA4: view_item
 */
export function trackViewContent(item: AnalyticsItem) {
  if (typeof window === 'undefined') return;

  const value = parsePrice(item.price);
  const currency = 'BDT';

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category || 'Apparel',
      content_type: 'product',
      value,
      currency,
    });
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency,
      value,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || 'Apparel',
          price: value,
          quantity: item.quantity || 1,
        },
      ],
    });
  }
}

/**
 * 2. Add To Cart
 * Meta Pixel: AddToCart
 * GA4: add_to_cart
 */
export function trackAddToCart(item: AnalyticsItem) {
  if (typeof window === 'undefined') return;

  const price = parsePrice(item.price);
  const quantity = item.quantity || 1;
  const value = price * quantity;
  const currency = 'BDT';

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
      value,
      currency,
      contents: [{ id: item.id, quantity, item_price: price }],
    });
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency,
      value,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_variant: item.size,
          price,
          quantity,
        },
      ],
    });
  }
}

/**
 * 3. Checkout Page Opened with Items
 * Meta Pixel: InitiateCheckout
 * GA4: begin_checkout
 */
export function trackInitiateCheckout({
  total,
  items,
}: {
  total: number;
  items: AnalyticsItem[];
}) {
  if (typeof window === 'undefined') return;

  const currency = 'BDT';
  const content_ids = items.map((i) => i.id);

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids,
      content_type: 'product',
      value: total,
      currency,
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
    });
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency,
      value: total,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: parsePrice(i.price),
        quantity: i.quantity || 1,
      })),
    });
  }
}

/**
 * 4. Order Confirmed / Placed
 * Meta Pixel: Purchase
 * GA4: purchase
 * Guarded with sessionStorage so page reloads do not duplicate purchase events.
 */
export function trackPurchase({
  orderId,
  total,
  items,
}: {
  orderId: string;
  total: number;
  items: AnalyticsItem[];
}) {
  if (typeof window === 'undefined') return;

  const sessionKey = `livus_tracked_order_${orderId}`;
  try {
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already tracked for this order session
    }
    sessionStorage.setItem(sessionKey, '1');
  } catch {}

  const currency = 'BDT';
  const content_ids = items.map((i) => i.id);

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids,
      content_type: 'product',
      value: total,
      currency,
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
    });
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: total,
      currency,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: parsePrice(i.price),
        quantity: i.quantity || 1,
      })),
    });
  }
}

/**
 * 5. Lead Generation / Newsletter Sign-up
 * Meta Pixel: Lead
 * GA4: sign_up
 */
export function trackLead({ formName, email }: { formName: string; email?: string }) {
  if (typeof window === 'undefined') return;

  // Meta Pixel
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: formName,
      status: 'success',
    });
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      method: formName,
    });
  }
}
