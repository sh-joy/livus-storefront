'use server';

import { db } from '@/db';
import { orders, customers, user } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { and, eq, or, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

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
    address: `${ord.shippingAddress}${ord.city ? `, ${ord.city}` : ''}`,
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
 * - Guest: must provide BOTH an exact order number and the phone number used on that order
 *   in `query` (e.g. "LIV-123456 01712345678"). Nothing else is searchable without signing in.
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

    // Guest lookup: exact order number + matching phone
    const orderNumMatch = q.match(/liv-\d{4,8}/i);
    const phoneMatch = q.replace(/liv-\d+/i, '').replace(/[^\d+]/g, '');
    if (!orderNumMatch || !BD_PHONE_RE.test(phoneMatch)) return [];

    const ord = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumMatch[0].toUpperCase()),
      with: { items: true },
    });
    if (!ord || normPhone(ord.phone) !== normPhone(phoneMatch)) return [];
    return [formatOrder(ord)];
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
