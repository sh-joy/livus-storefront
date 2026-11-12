'use server';

import { db } from '@/db';
import { orders, customers, user } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { headers, cookies } from 'next/headers';
import { and, eq, or, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { restoreStockForOrderItems } from '@/lib/order-pricing';
import { sendOrderStatusNotificationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyOrderConfirmationToken } from '@/lib/order-token';
import { formatLocation } from '@/lib/bangladesh-geo';

// NOTE: the old createOrderAction / getOrderByIdAction were removed. They were public endpoints that
// trusted browser-supplied totals and exposed any order by number. Orders are placed via
// placeOrderAction in ./checkout.ts, which re-prices everything on the server.

const BD_PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

async function getSessionUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch {
    return null;
  }
}

const normPhone = (p: string) => {
  const d = (p || '').replace(/\D/g, '');
  return d.startsWith('880') ? `0${d.slice(3)}` : d.startsWith('88') && d.length === 13 ? d.slice(2) : d;
};

function loadOrderShape() {
  return db.query.orders.findFirst({ with: { items: true } });
}
type OrderWithItems = NonNullable<Awaited<ReturnType<typeof loadOrderShape>>>;

function formatOrder(ord: OrderWithItems) {
  const formattedDate = ord.createdAt
    ? new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Recent Order';
  const totalNum = parseFloat(ord.totalAmount) || 0;
  const subtotalNum = ord.subtotalBdt || Math.max(0, totalNum - (ord.deliveryChargeBdt ?? 150) - (ord.vatBdt || 0));
  const money = (n: number) => `৳ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return {
    id: ord.orderNumber || `#${ord.id.substring(0, 8).toUpperCase()}`,
    rawId: ord.id,
    date: formattedDate,
    customerName: ord.customerName,
    phone: ord.phone,
    email: ord.email,
    location: formatLocation(ord.city, ord.district),
    address: [ord.shippingAddress, formatLocation(ord.city, ord.district)].filter(Boolean).join(', '),
    total: money(totalNum),
    status: ord.status || 'Pending',
    subtotal: money(subtotalNum),
    discount: ord.discountBdt ? money(ord.discountBdt) : null,
    vat: money(ord.vatBdt || 0),
    delivery: money(ord.deliveryChargeBdt ?? 150),
    items: (ord.items || []).map((item) => {
      const priceVal = item.priceBdt || parseFloat(item.price || '0') || 0;
      return {
        name: item.productName || 'Apparel Item',
        meta: `Color: ${item.variantName || 'Primary'} · Size: ${item.size || 'M'} · Qty: ${item.quantity}`,
        price: `৳ ${priceVal.toLocaleString()} BDT`,
        imageUrl: item.thumbnailUrl || '/images/for_him.jpg',
      };
    }),
  };
}

/**
 * Order history / lookup.
 * - Signed in: returns the signed-in customer's own orders (matched by account email or the phone
 *   on their customer record), optionally filtered by `query`.
 * - Guest: an exact order number (e.g. "LIV-123456") shows that order's status, items and totals only —
 *   never the customer's name, phone, email or address. Rate limited to 10 lookups a minute.
 * The first argument is ignored (kept for call-site compatibility) — identity comes from the session.
 */
export async function searchCustomerOrdersAction(_ignored?: string, query?: string) {
  try {
    if (!db) return [];
    const q = (query || '').trim().toLowerCase();
    const sessionUser = await getSessionUser();

    if (sessionUser) {
      const email = sessionUser.email.toLowerCase();
      const cust = await db.query.customers.findFirst({ where: eq(customers.email, email) });
      const conds = [eq(orders.email, email)];
      if (cust?.phone) conds.push(eq(orders.phone, cust.phone));

      const mine = await db.query.orders.findMany({
        where: or(...conds),
        with: { items: true },
        orderBy: [desc(orders.createdAt)],
      });

      const qDigits = q.replace(/\D/g, '');
      const filtered = !q
        ? mine
        : mine.filter((o) =>
            o.orderNumber?.toLowerCase().includes(q) ||
            (o.items || []).some((i) => (i.productName || '').toLowerCase().includes(q)) ||
            (qDigits.length >= 4 && normPhone(o.phone).includes(qDigits))
          );
      return filtered.map(formatOrder);
    }

    // Guest lookup: exact order number + matching phone (rate limit 10/min)
    const rate = await checkRateLimit('guest_order_lookup', 10, 60000);
    if (!rate.success) return [];

    const orderNumMatch = q.match(/liv-\d{4,8}/i);
    if (!orderNumMatch) return [];

    const ord = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumMatch[0].toUpperCase()),
      with: { items: true },
    });
    if (!ord) return [];
    // Strip personal details for guests: knowing an order number must not reveal who placed it or where it goes.
    return [{ ...formatOrder(ord), customerName: '', phone: '', email: '', address: '' }];
  } catch (err) {
    console.error('Error searching customer orders:', err);
    return [];
  }
}

/** Saved profile for the signed-in customer only. */
export async function getCustomerProfileAction(_ignoredEmail?: string) {
  try {
    if (!db) return null;
    const sessionUser = await getSessionUser();
    if (!sessionUser) return null;
    const email = sessionUser.email.toLowerCase();

    const cust = await db.query.customers.findFirst({ where: eq(customers.email, email) });
    if (cust) {
      return {
        fullName: cust.fullName || '',
        phone: cust.phone || '',
        email: cust.email || '',
        address: cust.address || '',
        apt: cust.apt || '',
        city: cust.city || '',
        district: cust.district || '',
        postalCode: cust.postalCode || '',
      };
    }

    const lastOrder = await db.query.orders.findFirst({
      where: eq(orders.email, email),
      orderBy: [desc(orders.createdAt)],
    });
    if (lastOrder) {
      return {
        fullName: lastOrder.customerName || '',
        phone: lastOrder.phone || '',
        email: lastOrder.email || '',
        address: lastOrder.shippingAddress || '',
        apt: '',
        city: lastOrder.city || '',
        district: lastOrder.district || '',
        postalCode: lastOrder.postalCode || '',
      };
    }

    return {
      fullName: sessionUser.name || '',
      phone: '',
      email: sessionUser.email || '',
      address: '',
      apt: '',
      city: '',
      district: '',
      postalCode: '',
    };
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    return null;
  }
}

/** Saves the signed-in customer's profile. The email is always the account email. */
export async function saveCustomerProfileAction(data: {
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
  apt?: string;
  city?: string;
  district?: string;
  postalCode?: string;
}) {
  try {
    if (!db) return { success: false, error: 'Database not initialized' };
    const sessionUser = await getSessionUser();
    if (!sessionUser) return { success: false, error: 'Please sign in to update your profile.' };

    const email = sessionUser.email.toLowerCase();
    const cleanName = (data.fullName || '').trim() || sessionUser.name || 'Valued Customer';
    const cleanPhone = (data.phone || '').trim().replace(/[\s-]/g, '');

    if (cleanPhone && !BD_PHONE_RE.test(cleanPhone)) {
      return { success: false, error: 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678).' };
    }

    const mine = await db.query.customers.findFirst({ where: eq(customers.email, email) });

    if (cleanPhone) {
      // Phone is unique across customers. Don't let one account take over another person's record.
      const phoneOwner = await db.query.customers.findFirst({ where: eq(customers.phone, cleanPhone) });
      if (phoneOwner && phoneOwner.id !== mine?.id && phoneOwner.email && phoneOwner.email.toLowerCase() !== email) {
        return { success: false, error: 'This phone number is already linked to another account.' };
      }
      if (phoneOwner && !mine) {
        // Guest record with this phone (from an earlier checkout) → claim it for this account
        await db.update(customers).set({
          fullName: cleanName,
          email,
          address: data.address || '',
          apt: data.apt || '',
          city: data.city || '',
          district: data.district || '',
          postalCode: data.postalCode || '',
          updatedAt: new Date(),
        }).where(eq(customers.id, phoneOwner.id));
      }
    }

    const fields = {
      fullName: cleanName,
      address: data.address || '',
      apt: data.apt || '',
      city: data.city || '',
      district: data.district || '',
      postalCode: data.postalCode || '',
      updatedAt: new Date(),
    };

    if (mine) {
      await db.update(customers).set({ ...fields, phone: cleanPhone || mine.phone }).where(eq(customers.id, mine.id));
    } else if (cleanPhone) {
      const claimed = await db.query.customers.findFirst({ where: and(eq(customers.phone, cleanPhone), eq(customers.email, email)) });
      if (!claimed) {
        await db.insert(customers).values({ ...fields, email, phone: cleanPhone, totalOrdersCount: 0, totalSpentBdt: 0 });
      }
    } else {
      return { success: false, error: 'Please add your phone number so we can save your delivery details.' };
    }

    await db.update(user).set({ name: cleanName, updatedAt: new Date() }).where(eq(user.id, sessionUser.id));

    revalidatePath('/admin/customers');
    revalidatePath('/profile');
    return { success: true };
  } catch (err) {
    console.error('Error saving customer profile:', err);
    return { success: false, error: 'Failed to save profile changes.' };
  }
}

/**
 * Customer Self-Service Order Cancellation.
 * Allows cancelling an order if status is currently "Pending".
 * Re-stores inventory in stock_inventory and triggers status email.
 */
export async function cancelCustomerOrderAction(orderIdOrNumber: string, guestPhone?: string) {
  // Rate limit: 10 cancellations per minute per IP
  const rate = await checkRateLimit('cancel_order', 10, 60000);
  if (!rate.success) {
    return { success: false, message: 'Too many cancellation requests. Please wait a minute and try again.' };
  }

  try {
    if (!db) return { success: false, message: 'Database not initialized.' };
    const sessionUser = await getSessionUser();
    const cleanKey = (orderIdOrNumber || '').trim();
    if (!cleanKey) return { success: false, message: 'Order reference is required.' };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey);
    const ord = await db.query.orders.findFirst({
      where: isUuid
        ? or(eq(orders.id, cleanKey), eq(orders.orderNumber, cleanKey.toUpperCase()))
        : eq(orders.orderNumber, cleanKey.toUpperCase()),
      with: { items: true },
    });

    if (!ord) {
      return { success: false, message: 'Order not found.' };
    }

    // Security check:
    // Signed-in caller must match order email or customer profile phone
    if (sessionUser) {
      const email = sessionUser.email.toLowerCase();
      const isOwner =
        (ord.email && ord.email.toLowerCase() === email) ||
        (await db.query.customers.findFirst({
          where: and(eq(customers.email, email), eq(customers.phone, ord.phone)),
        }));
      if (!isOwner) {
        return { success: false, message: 'You are not authorized to cancel this order.' };
      }
    } else {
      // Signed-out guest caller MUST provide matching order phone number
      const cleanGuestPhone = normPhone(guestPhone || '');
      if (!cleanGuestPhone || cleanGuestPhone !== normPhone(ord.phone)) {
        return { success: false, message: 'Phone verification failed. You are not authorized to cancel this order.' };
      }
    }

    // Atomic update: only updates if current status is exactly 'Pending'
    // Prevents double-cancellation and race conditions
    const updated = await db
      .update(orders)
      .set({
        status: 'Cancelled',
        paymentStatus: 'Cancelled',
      })
      .where(and(eq(orders.id, ord.id), eq(orders.status, 'Pending')))
      .returning({ id: orders.id });

    if (updated.length === 0) {
      return {
        success: false,
        message: `Order cannot be cancelled because it is no longer pending (current status: ${ord.status}).`,
      };
    }

    // Restore stock inventory atomically
    if (ord.items && ord.items.length > 0) {
      await restoreStockForOrderItems(
        ord.items.map((i) => ({
          productId: i.productId,
          variantName: i.variantName,
          size: i.size,
          quantity: i.quantity,
        }))
      );
    }

    // Await notification email dispatch safely (P0.4)
    if (ord.email) {
      try {
        await sendOrderStatusNotificationEmail({
          to: ord.email,
          customerName: ord.customerName,
          orderNumber: ord.orderNumber,
          newStatus: 'Cancelled',
          customMessage: 'Your order has been cancelled per your request. If any payment was made, our support team will process your refund promptly.',
        });
      } catch (err) {
        console.warn('Cancel email dispatch non-fatal warning:', err);
      }
    }

    revalidatePath('/profile');
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/admin/analytics');
    return { success: true, message: 'Your order has been successfully cancelled.' };
  } catch (err) {
    console.error('Error cancelling order:', err);
    return { success: false, message: 'An unexpected error occurred while cancelling your order.' };
  }
}

/**
 * Server-verified order confirmation lookup (SQA M5).
 * NEVER trusts query params for sensitive details.
 * Authorized ONLY if:
 * 1. Visitor is signed into the account matching the order's email or customer phone.
 * 2. Visitor holds the short-lived signed HMAC cookie set by placeOrderAction on checkout.
 */
export async function getConfirmedOrderDetailsAction(orderNumber: string) {
  try {
    if (!db) return { authorized: false as const, error: 'Database unavailable' };
    const cleanNum = (orderNumber || '').trim().toUpperCase();
    if (!cleanNum || !/^LIV-\d+$/i.test(cleanNum)) {
      return { authorized: false as const };
    }

    const ord = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, cleanNum),
      with: { items: true },
    });

    if (!ord) {
      return { authorized: false as const };
    }

    // Ownership check:
    let isOwner = false;

    // 1. Check signed-in account session
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      const email = sessionUser.email.toLowerCase();
      if (ord.email && ord.email.toLowerCase() === email) {
        isOwner = true;
      } else {
        const cust = await db.query.customers.findFirst({ where: eq(customers.email, email) });
        if (cust?.phone && normPhone(cust.phone) === normPhone(ord.phone)) {
          isOwner = true;
        }
      }
    }

    // 2. Check signed confirmation cookie from placeOrderAction
    if (!isOwner) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get('livus_order_confirm')?.value;
        if (token) {
          const verified = verifyOrderConfirmationToken(token, cleanNum);
          if (verified.valid && verified.phone && normPhone(verified.phone) === normPhone(ord.phone)) {
            isOwner = true;
          }
        }
      } catch (cookieErr) {
        console.warn('Cookie verification non-fatal error:', cookieErr);
      }
    }

    if (!isOwner) {
      return { authorized: false as const };
    }

    const totalNum = parseFloat(ord.totalAmount) || 0;
    return {
      authorized: true as const,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      location: formatLocation(ord.city, ord.district),
      shippingAddress: ord.shippingAddress,
      paymentMethod: ord.paymentMethod || 'Cash on Delivery',
      paymentStatus: ord.paymentStatus || 'Unpaid (COD)',
      paymentTrxId: ord.paymentTrxId || undefined,
      paymentSenderPhone: ord.paymentSenderPhone || undefined,
      totalAmount: totalNum,
      status: ord.status || 'Pending',
      itemsCount: ord.items?.length || 0,
      createdAt: ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error in getConfirmedOrderDetailsAction:', err);
    return { authorized: false as const };
  }
}


