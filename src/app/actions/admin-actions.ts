'use server';

import { requireAdmin } from '@/lib/admin-guard';
import { db } from '@/db';
import { products, categories, promoCodes, orders, orderItems, colorVariants, variantImages, stockInventory, customers, user, account, session, storeSettings, shippingRegions } from '@/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, desc, sql, and, ne } from 'drizzle-orm';
import fs from 'fs';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminToken, safeEqual } from '@/lib/admin-session';
import path from 'path';
import { restoreStockForOrderItems, quoteOrder, reserveStock, releaseStock, computeOrderCharges } from '@/lib/order-pricing';
import { randomInt } from 'crypto';

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
import { sendOrderStatusNotificationEmail } from '@/lib/email';

// ----------------------------------------------------
// 1. PRODUCTS SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminProducts() {
  await requireAdmin();
  try {
    if (db) {
      const list = await db.query.products.findMany({
        with: {
          colorVariants: true,
        },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
      });

      if (list.length > 0) {
        return list.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: 'For Him',
          priceBdt: p.priceBdt,
          colors: p.colorVariants.length > 0 ? p.colorVariants.map(v => v.name) : ['Default'],
          isLowStock: p.colorVariants.some(v => v.isLowStock),
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching admin products:', error);
  }

  // Fallback if empty
  return [
    {
      id: "oakwood-1",
      name: "Oakwood Long sleeve",
      slug: "oakwood-long-sleeve",
      category: "For Him",
      priceBdt: 899,
      colors: ["Yellow", "Black", "Grey"],
      isLowStock: true,
    },
    {
      id: "owayo-1",
      name: "OWAYO - CROSS FADE",
      slug: "owayo-cross-fade",
      category: "For Him",
      priceBdt: 899,
      colors: ["Black & White"],
      isLowStock: false,
    },
  ];
}

export async function createAdminProductAction(data: {
  name: string;
  slug: string;
  priceBdt: number;
  description?: string;
  colorName?: string;
  hexColor?: string;
}) {
  await requireAdmin();
  try {
    if (!db) return { success: false, message: 'Database connection missing' };

    // 1. Insert product
    const [newProduct] = await db.insert(products).values({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || 'Performance apparel item',
      priceBdt: data.priceBdt || 899,
    }).returning();

    // 2. Insert primary color variant
    const [variant] = await db.insert(colorVariants).values({
      productId: newProduct.id,
      name: data.colorName || 'Yellow',
      hexColor: data.hexColor || '#E6A100',
      thumbnailUrl: '/images/products/oakwood-yellow-thumb.png',
      isLowStock: false,
    }).returning();

    // 3. Insert default variant gallery image & size inventory
    await db.insert(variantImages).values({
      variantId: variant.id,
      imageUrl: '/images/products/oakwood-yellow-1.png',
      displayOrder: 1,
    });

    await db.insert(stockInventory).values([
      { variantId: variant.id, size: 'S', quantity: 10, isStockOut: false },
      { variantId: variant.id, size: 'M', quantity: 10, isStockOut: false },
      { variantId: variant.id, size: 'XL', quantity: 10, isStockOut: false },
    ]);

    revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
    revalidatePath('/product');
    return { success: true, product: newProduct };
  } catch (error) {
    console.error('Failed to create admin product:', error);
    return { success: false, message: 'Failed to create product in Neon database' };
  }
}

export async function deleteAdminProductAction(id: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(products).where(eq(products.id, id));
      revalidatePath('/admin/products');
    revalidatePath('/', 'layout');
      revalidatePath('/product');
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to delete product:', error);
  }
  return { success: true };
}

// ----------------------------------------------------
// 2. CATEGORIES SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminCategories() {
  await requireAdmin();
  try {
    if (db) {
      const list = await db.select().from(categories).orderBy(desc(categories.createdAt));
      return list.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || 'Store category',
      }));
    }
  } catch (error) {
    console.error('Error fetching admin categories:', error);
  }

  return [];
}

const DEFAULT_PRODUCT_TYPES = [
  "Shirt",
  "Pant",
  "Two Piece",
  "Jersey",
  "Hoodie",
  "Jacket",
  "Shorts",
  "Casual",
  "Other",
];

export async function fetchAdminProductTypesAction(): Promise<string[]> {
  await requireAdmin();
  try {
    if (!db) return DEFAULT_PRODUCT_TYPES;
    const settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    if (settings?.productTypes) {
      const parsed = JSON.parse(settings.productTypes);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Failed to fetch product types:', err);
  }
  return DEFAULT_PRODUCT_TYPES;
}

export async function updateAdminProductTypesAction(types: string[]) {
  await requireAdmin();
  try {
    if (!db) return { success: false, message: 'Database not initialized' };
    await db.update(storeSettings).set({
      productTypes: JSON.stringify(types),
      updatedAt: new Date(),
    }).where(eq(storeSettings.id, 'general'));

    revalidatePath('/admin/categories');
    revalidatePath('/admin/products/new');
    return { success: true };
  } catch (err) {
    console.error('Failed to update product types:', err);
    return { success: false, message: 'Failed to update product types' };
  }
}

export async function createAdminCategoryAction(data: { name: string; slug: string; description?: string }) {
  await requireAdmin();
  try {
    if (!db) return { success: false, message: 'Database connection missing' };

    const [newCat] = await db.insert(categories).values({
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      description: data.description || 'Store collection',
    }).returning();

    revalidatePath('/admin/categories');
    return { success: true, category: newCat };
  } catch (error) {
    console.error('Failed to create category:', error);
    return { success: false, message: 'Failed to create category in Neon database' };
  }
}

export async function deleteAdminCategoryAction(id: string) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) return { success: false, message: 'Invalid category.' };
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id));
    if (Number(count) > 0) {
      return {
        success: false,
        message: `This category still has ${count} product${Number(count) === 1 ? '' : 's'}. Move them to another category first.`,
      };
    }
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath('/admin/categories');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete category:', error);
    return { success: false, message: 'Failed to delete category' };
  }
}

// ----------------------------------------------------
// 3. PROMO CODES SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminPromos() {
  await requireAdmin();
  try {
    if (db) {
      const list = await db.select().from(promoCodes);
      if (list.length > 0) {
        return list.map(p => ({
          id: p.id,
          code: p.code,
          type: p.discountType as 'percentage' | 'fixed',
          value: p.discountValue,
          isActive: p.isActive,
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching admin promos:', error);
  }

  return [
    { id: "p1", code: "LIVUS10", type: "percentage" as const, value: 10, isActive: true },
    { id: "p2", code: "SAVE500", type: "fixed" as const, value: 500, isActive: true },
    { id: "p3", code: "GIFT2000", type: "fixed" as const, value: 2000, isActive: true },
  ];
}

export async function createAdminPromoAction(data: { code: string; type: 'percentage' | 'fixed'; value: number }) {
  await requireAdmin();
  const code = (data.code || '').trim().toUpperCase();
  const value = Number(data.value);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return { success: false, message: 'Code must be 3–30 letters, numbers, dashes or underscores.' };
  }
  if (data.type !== 'percentage' && data.type !== 'fixed') {
    return { success: false, message: 'Discount type must be percentage or fixed.' };
  }
  if (!Number.isInteger(value) || value <= 0 || (data.type === 'percentage' && value > 100)) {
    return { success: false, message: data.type === 'percentage' ? 'Percentage must be between 1 and 100.' : 'Discount amount must be a positive whole number.' };
  }
  try {
    if (!db) return { success: false, message: 'Database connection missing' };

    const [newPromo] = await db.insert(promoCodes).values({
      code: data.code.trim().toUpperCase(),
      discountType: data.type,
      discountValue: data.value,
      isActive: true,
    }).returning();

    revalidatePath('/admin/promos');
    return { success: true, promo: newPromo };
  } catch (error) {
    console.error('Failed to create promo code:', error);
    return { success: false, message: 'Failed to create promo code in Neon database' };
  }
}

export async function deleteAdminPromoAction(id: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(promoCodes).where(eq(promoCodes.id, id));
      revalidatePath('/admin/promos');
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to delete promo code:', error);
  }
  return { success: true };
}

// ----------------------------------------------------
// ----------------------------------------------------
// 4. ORDERS SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminOrders() {
  await requireAdmin();
  try {
    if (db) {
      const list = await db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        with: {
          items: true,
        },
      });

      if (list.length > 0) {
        return list.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber || `LIV-${o.id.substring(0, 4).toUpperCase()}`,
          customerName: o.customerName || 'Customer',
          phone: o.phone || 'N/A',
          email: o.email || '',
          shippingAddress: o.shippingAddress,
          city: o.city || '',
          district: o.district || '',
          postalCode: o.postalCode || '',
          deliveryInstructions: o.deliveryInstructions || '',
          subtotalBdt: o.subtotalBdt || 0,
          vatBdt: o.vatBdt || 0,
          deliveryChargeBdt: o.deliveryChargeBdt || 150,
          discountBdt: o.discountBdt || 0,
          totalAmount: parseFloat(o.totalAmount) || 0,
          paymentMethod: o.paymentMethod || 'Cash on Delivery',
          paymentStatus: o.paymentStatus || 'Unpaid (COD)',
          status: o.status || 'Pending',
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now',
          items: o.items || [],
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching admin orders:', error);
  }

  // Fallback demo orders if database table is fresh
  return [
    {
      id: "ord-demo-1",
      orderNumber: "LIV-9281",
      customerName: "Rahim Chowdhury",
      phone: "+8801711223344",
      email: "rahim@example.com",
      shippingAddress: "House 14, Road 5, Dhanmondi",
      city: "Dhaka",
      district: "Dhaka",
      postalCode: "1205",
      deliveryInstructions: "Please call before arrival. Leave with security if unavailable.",
      subtotalBdt: 899,
      vatBdt: 90,
      deliveryChargeBdt: 150,
      discountBdt: 0,
      totalAmount: 1139,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Unpaid (COD)",
      status: "Pending",
      createdAt: "Jul 29, 2026, 2:30 PM",
      items: [
        {
          id: "item-1",
          productId: "prod-1",
          productName: "Grey Textured Crepe Two Piece",
          variantName: "Grey",
          size: "XL",
          thumbnailUrl: "/images/for_her.jpg",
          quantity: 1,
          priceBdt: 899,
          price: "899",
        },
      ],
    },
    {
      id: "ord-demo-2",
      orderNumber: "LIV-9280",
      customerName: "Tariq Hasan",
      phone: "+8801819887766",
      email: "tariq@example.com",
      shippingAddress: "GEC Circle, Agrabad",
      city: "Chittagong",
      district: "Chittagong",
      postalCode: "4000",
      deliveryInstructions: "Deliver between 10 AM and 5 PM.",
      subtotalBdt: 1798,
      vatBdt: 90,
      deliveryChargeBdt: 150,
      discountBdt: 100,
      totalAmount: 1938,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Unpaid (COD)",
      status: "Processing",
      createdAt: "Jul 28, 2026, 11:15 AM",
      items: [
        {
          id: "item-2",
          productId: "prod-2",
          productName: "Lavender Stripe Slim Fit Shirt",
          variantName: "Lavender",
          size: "L",
          thumbnailUrl: "/images/for_him.jpg",
          quantity: 2,
          priceBdt: 899,
          price: "899",
        },
      ],
    },
  ];
}

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  await requireAdmin();
  if (!(ORDER_STATUSES as readonly string[]).includes(newStatus)) {
    return { success: false, message: `Unknown status "${newStatus}".` };
  }
  try {
    if (!db) return { success: false, message: 'Database not initialized' };

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });

    if (!existing) {
      return { success: false, message: 'Order not found' };
    }

    const prevStatus = existing.status;
    let newPaymentStatus = existing.paymentStatus;

    // P0.3: Never auto-verify bKash or Nagad on Delivered. Only COD collected cash at doorstep
    if (newStatus === 'Delivered') {
      const method = (existing.paymentMethod || '').toLowerCase();
      if (method.includes('cash')) {
        newPaymentStatus = 'Paid (COD Collected)';
      }
    } else if (newStatus === 'Cancelled') {
      newPaymentStatus = 'Cancelled';
    }

    // P0.6 & E5: Re-opening a cancelled order must safely re-reserve stock and reset payment status
    if (prevStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      const method = (existing.paymentMethod || '').toLowerCase();
      if (method.includes('bkash') || method.includes('nagad')) {
        newPaymentStatus = 'Awaiting Verification';
      } else if (method.includes('cash')) {
        newPaymentStatus = 'Unpaid (COD)';
      }

      if (existing.items && existing.items.length > 0) {
        const quote = await quoteOrder(
          existing.items.map((i) => ({
            productId: i.productId,
            variantName: i.variantName || undefined,
            size: i.size || undefined,
            quantity: i.quantity,
          }))
        );
        if (!quote.ok) {
          return { success: false, message: `Cannot re-open order: ${quote.message}` };
        }
        const reserved = await reserveStock(quote.quote.lines);
        if (!reserved.ok) {
          return { success: false, message: `Cannot re-open order: ${reserved.message}` };
        }
      }
    }

    // If cancelling, make the update atomic so stock is restored exactly once
    if (newStatus === 'Cancelled') {
      const updated = await db
        .update(orders)
        .set({ status: 'Cancelled', paymentStatus: newPaymentStatus })
        .where(and(eq(orders.id, orderId), ne(orders.status, 'Cancelled')))
        .returning({ id: orders.id });

      if (updated.length > 0 && existing.items && existing.items.length > 0) {
        await restoreStockForOrderItems(
          existing.items.map((i) => ({
            productId: i.productId,
            variantName: i.variantName,
            size: i.size,
            quantity: i.quantity,
          }))
        );
      }
    } else {
      await db
        .update(orders)
        .set({ status: newStatus, paymentStatus: newPaymentStatus })
        .where(eq(orders.id, orderId));
    }

    // P0.4: Safe email notification
    if (existing.email && newStatus !== prevStatus) {
      try {
        await sendOrderStatusNotificationEmail({
          to: existing.email,
          customerName: existing.customerName,
          orderNumber: existing.orderNumber,
          newStatus: newStatus,
        });
      } catch (e) {
        console.warn('Order status email warning:', e);
      }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/admin/analytics');
    revalidatePath('/profile');
    return { success: true, message: `Order status updated to ${newStatus}` };
  } catch (error) {
    console.error('Failed to update order status:', error);
    return { success: false, message: 'Failed to update order status' };
  }
}

/**
 * P0.3 & E6: Explicit admin verification for manual mobile wallet payments (bKash / Nagad)
 */
export async function verifyOrderPaymentAction(orderId: string, action: 'verify' | 'reject', cancelOrder?: boolean) {
  const admin = await requireAdmin();
  try {
    if (!db) return { success: false, message: 'Database not initialized' };

    const ord = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });
    if (!ord) return { success: false, message: 'Order not found' };

    const method = (ord.paymentMethod || '').toLowerCase();
    // E6: Restrict payment verification exclusively to bKash and Nagad orders
    if (!method.includes('bkash') && !method.includes('nagad')) {
      return {
        success: false,
        message: 'Payment verification is only permitted for bKash or Nagad manual mobile wallet orders. Cash on Delivery is collected upon delivery.',
      };
    }

    console.log(`[AUDIT] Order payment ${action} for ${ord.orderNumber} by ${admin.email} (role: ${admin.role}) at ${new Date().toISOString()}`);

    let newPaymentStatus: string;
    if (action === 'verify') {
      newPaymentStatus = method.includes('bkash') ? 'Paid (bKash Verified)' : 'Paid (Nagad Verified)';
      await db.update(orders).set({ paymentStatus: newPaymentStatus }).where(eq(orders.id, orderId));
    } else {
      newPaymentStatus = 'Payment Failed / Rejected';
      if (cancelOrder) {
        // Release stock and cancel order
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
        await db.update(orders).set({
          status: 'Cancelled',
          paymentStatus: newPaymentStatus,
        }).where(eq(orders.id, orderId));
      } else {
        await db.update(orders).set({ paymentStatus: newPaymentStatus }).where(eq(orders.id, orderId));
      }
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/admin/analytics');
    return { success: true, message: `Payment status marked as ${newPaymentStatus}` };
  } catch (err) {
    console.error('Failed to verify order payment:', err);
    return { success: false, message: 'Failed to update payment status' };
  }
}


export async function deleteAdminOrderAction(orderId: string) {
  await requireAdmin();
  try {
    const existing = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
    if (!existing) return { success: false, message: 'Order not found' };

    // Stock is still held for orders that haven't left the store; give it back.
    if (['Pending', 'Processing'].includes(existing.status) && existing.items?.length) {
      await restoreStockForOrderItems(
        existing.items.map((i) => ({ productId: i.productId, variantName: i.variantName, size: i.size, quantity: i.quantity }))
      );
    }
    await db.delete(orders).where(eq(orders.id, orderId));
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    revalidatePath('/profile');
    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    console.error('Failed to delete order:', error);
    return { success: false, message: 'Failed to delete order' };
  }
}

export async function createAdminOrderAction(data: {
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  status?: string;
  paymentMethod?: string;
  items: {
    productId?: string;
    productName: string;
    variantName?: string;
    size?: string;
    quantity: number;
    priceBdt: number;
  }[];
}) {
  await requireAdmin();
  const cleanPhone = (data.phone || '').trim().replace(/[\s-]/g, '');
  const cleanName = (data.customerName || '').trim();
  const cleanEmail = data.email ? data.email.trim().toLowerCase() : null;
  const cleanAddress = (data.shippingAddress || '').trim();
  const cleanCity = data.city ? data.city.trim() : '';
  const cleanDistrict = data.district ? data.district.trim() : 'Dhaka Division';
  const status = data.status && (ORDER_STATUSES as readonly string[]).includes(data.status) ? data.status : 'Pending';

  if (!cleanName) return { success: false, message: 'Customer name is required.' };
  if (!BD_PHONE.test(cleanPhone)) return { success: false, message: 'Enter a valid 11-digit Bangladeshi phone number.' };
  if (!cleanAddress) return { success: false, message: 'Shipping address is required.' };
  if (!data.items || data.items.length === 0) return { success: false, message: 'Add at least one item.' };
  for (const i of data.items) {
    if (!Number.isInteger(i.quantity) || i.quantity < 1) return { success: false, message: 'Item quantity must be at least 1.' };
    if (!Number.isFinite(i.priceBdt) || i.priceBdt < 0) return { success: false, message: 'Item price cannot be negative.' };
  }

  try {
    // Resolve catalogue items (to check and take stock); manual items without a product are allowed.
    const catalogItems = data.items.filter((i) => i.productId);
    let reservedRows: { id: string; qty: number }[] = [];
    let lineMeta: { productId: string; thumbnailUrl: string | null }[] = data.items.map((i) => ({ productId: i.productId || 'manual', thumbnailUrl: null }));
    if (catalogItems.length > 0 && status !== 'Cancelled' && status !== 'Delivered') {
      const quote = await quoteOrder(
        catalogItems.map((i) => ({ productId: i.productId!, variantName: i.variantName, size: i.size, quantity: i.quantity })),
        undefined,
        cleanDistrict
      );
      if (!quote.ok) return { success: false, message: quote.message };
      const reserved = await reserveStock(quote.quote.lines);
      if (!reserved.ok) return { success: false, message: reserved.message };
      reservedRows = quote.quote.lines.filter((l) => l.stockRowId).map((l) => ({ id: l.stockRowId!, qty: l.quantity }));
      let k = 0;
      lineMeta = data.items.map((i) => {
        if (!i.productId) return { productId: 'manual', thumbnailUrl: null };
        const l = quote.quote.lines[k++];
        return { productId: l.productId, thumbnailUrl: l.thumbnailUrl };
      });
    }

    // Admin may set the price (e.g. phone orders); VAT and delivery follow the same rules as checkout.
    const subtotalBdt = data.items.reduce((sum, i) => sum + Math.round(i.priceBdt) * i.quantity, 0);
    const charges = await computeOrderCharges(subtotalBdt, 0, cleanDistrict);

    let orderNum = `LIV-${randomInt(100000, 1000000)}`;
    for (let t = 0; t < 5; t++) {
      const clash = await db.query.orders.findFirst({ where: eq(orders.orderNumber, orderNum), columns: { id: true } });
      if (!clash) break;
      orderNum = `LIV-${randomInt(100000, 1000000)}`;
    }

    const method = data.paymentMethod || 'Cash on Delivery';
    const isCod = /cash/i.test(method);
    const paymentStatus = status === 'Delivered' ? (isCod ? 'Paid (COD Collected)' : 'Paid (Verified)') : isCod ? 'Unpaid (COD)' : 'Awaiting Verification';

    let newOrderId: string;
    try {
      const [newOrder] = await db.insert(orders).values({
        orderNumber: orderNum,
        customerName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        shippingAddress: cleanAddress,
        city: cleanCity,
        district: cleanDistrict,
        subtotalBdt,
        vatBdt: charges.vatBdt,
        deliveryChargeBdt: charges.deliveryChargeBdt,
        discountBdt: 0,
        totalAmount: charges.totalBdt.toString(),
        paymentMethod: method,
        status,
        paymentStatus,
      }).returning();
      newOrderId = newOrder.id;

      await db.insert(orderItems).values(
        data.items.map((item, idx) => ({
          orderId: newOrder.id,
          productId: lineMeta[idx].productId,
          productName: item.productName || 'Apparel Item',
          variantName: item.variantName || 'Primary',
          size: item.size || 'M',
          thumbnailUrl: lineMeta[idx].thumbnailUrl || '/images/for_him.jpg',
          quantity: item.quantity,
          priceBdt: Math.round(item.priceBdt),
          price: String(Math.round(item.priceBdt)),
        }))
      );
    } catch (insertErr) {
      await releaseStock(reservedRows);
      throw insertErr;
    }

    // Link / create the CRM customer (non-fatal)
    try {
      const existingCustomer = await db.query.customers.findFirst({ where: eq(customers.phone, cleanPhone) });
      let customerId = existingCustomer?.id ?? null;
      if (!existingCustomer) {
        const [c] = await db.insert(customers).values({
          fullName: cleanName, phone: cleanPhone, email: cleanEmail, address: cleanAddress,
          city: cleanCity, district: cleanDistrict, totalOrdersCount: 1, totalSpentBdt: charges.totalBdt,
        }).returning();
        customerId = c?.id ?? null;
      } else {
        await db.update(customers).set({
          totalOrdersCount: (existingCustomer.totalOrdersCount || 0) + 1,
          totalSpentBdt: (existingCustomer.totalSpentBdt || 0) + charges.totalBdt,
          updatedAt: new Date(),
        }).where(eq(customers.id, existingCustomer.id));
      }
      if (customerId) await db.update(orders).set({ customerId }).where(eq(orders.id, newOrderId));
    } catch (custErr) {
      console.warn('Admin order customer link warning:', custErr);
    }

    revalidatePath('/admin/orders');
    revalidatePath('/admin/customers');
    revalidatePath('/admin');
    return { success: true, orderId: newOrderId, orderNumber: orderNum, message: 'Order created successfully' };
  } catch (error) {
    console.error('Failed to create admin order:', error);
    return { success: false, message: 'Failed to create order' };
  }
}

export async function editAdminOrderAction(data: {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  status: string;
}) {
  await requireAdmin();
  if (!(ORDER_STATUSES as readonly string[]).includes(data.status)) {
    return { success: false, message: `Unknown status "${data.status}".` };
  }
  if (!(data.customerName || '').trim() || !(data.shippingAddress || '').trim()) {
    return { success: false, message: 'Customer name and address are required.' };
  }
  if (!BD_PHONE.test((data.phone || '').trim().replace(/[\s-]/g, ''))) {
    return { success: false, message: 'Enter a valid 11-digit Bangladeshi phone number.' };
  }
  try {
    if (db) {
      await db.update(orders).set({
        customerName: data.customerName.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim() : null,
        shippingAddress: data.shippingAddress.trim(),
        city: data.city ? data.city.trim() : '',
        district: data.district ? data.district.trim() : '',
        status: data.status,
        paymentStatus: data.status === 'Delivered' ? 'Paid (COD Collected)' : 'Unpaid (COD)',
      }).where(eq(orders.id, data.orderId));

      revalidatePath('/admin/orders');
      revalidatePath('/profile');
      return { success: true, message: 'Order updated successfully' };
    }
  } catch (error) {
    console.error('Failed to edit order:', error);
    return { success: false, message: 'Failed to update order' };
  }
  return { success: true, message: 'Order updated successfully' };
}

// ----------------------------------------------------
// 5. ADMIN USER MANAGEMENT SERVER ACTIONS
// ----------------------------------------------------

const CREDENTIALS_FILE = path.join(process.cwd(), '.admin-credentials.json');

interface AdminCredentialRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
}

function getStoredAdminUsers(): AdminCredentialRecord[] {
  // Local-development convenience only. In production, admins live in the database
  // (hashed passwords via Better Auth) — never in a file or in source code.
  if (process.env.NODE_ENV === 'production') return [];
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error("Error reading .admin-credentials.json:", err);
  }
  return [];
}

function saveStoredAdminUser(newUserRecord: AdminCredentialRecord) {
  try {
    const list = getStoredAdminUsers();
    const cleanEmail = newUserRecord.email.trim().toLowerCase();
    const filtered = list.filter(u => u.email.toLowerCase() !== cleanEmail);
    filtered.push(newUserRecord);
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving to .admin-credentials.json:", err);
  }
}

function deleteStoredAdminUser(emailToDelete: string) {
  try {
    const list = getStoredAdminUsers();
    const cleanEmail = emailToDelete.trim().toLowerCase();
    const filtered = list.filter(u => u.email.toLowerCase() !== cleanEmail);
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error deleting from .admin-credentials.json:", err);
  }
}

export async function fetchAdminUsersAction() {
  await requireAdmin();
  const localList = getStoredAdminUsers();
  const mapByEmail = new Map<string, AdminCredentialRecord>();
  localList.forEach(u => mapByEmail.set(u.email.toLowerCase(), u));

  try {
    if (db) {
      const list = await db.select().from(user);
      const adminUsers = list.filter((u) => u.role === 'admin' || u.role === 'superadmin');
      
      if (adminUsers.length > 0) {
        adminUsers.forEach(u => {
          const clean = u.email.toLowerCase();
          if (!mapByEmail.has(clean)) {
            mapByEmail.set(clean, {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role || 'admin',
              createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active',
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error fetching admin users from DB:', error);
  }

  return Array.from(mapByEmail.values()).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    hasPassword: !!u.password,
  }));
}

export async function createAdminUserAction(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  await requireAdmin({ superadmin: true });
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    if (!cleanName || !cleanEmail || !data.password) {
      return { success: false, message: 'Name, email, and password are required.' };
    }

    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userRole = data.role || 'admin';
    const createdAtStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newRecord: AdminCredentialRecord = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      password: data.password,
      role: userRole,
      createdAt: createdAtStr,
    };

    // Save to persistent JSON store
    saveStoredAdminUser(newRecord);

    // Sync to database if DB connected
    if (db) {
      const existing = await db.select().from(user).where(eq(user.email, cleanEmail));
      if (existing.length > 0) {
        await db.update(user).set({
          name: cleanName,
          role: userRole,
          emailVerified: true,
        }).where(eq(user.email, cleanEmail));
      } else {
        await db.insert(user).values({
          id: newUserId,
          name: cleanName,
          email: cleanEmail,
          emailVerified: true,
          role: userRole,
        });
      }

      try {
        await auth.api.signUpEmail({
          body: {
            email: cleanEmail,
            password: data.password,
            name: cleanName,
          },
        });
      } catch (authErr: any) {
        console.warn("Better Auth sign up note (non-fatal):", authErr?.message);
      }
    }

    revalidatePath('/admin/settings');
    return { success: true, message: `Admin account created for ${cleanEmail}` };
  } catch (error: any) {
    console.error('Failed to create admin user:', error);
    return { success: false, message: error?.message || 'Failed to create admin user.' };
  }
}

export async function verifyAdminLoginAction(email: string, pass: string) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const password = pass || '';
  const fail = { success: false as const, message: 'Invalid administrative email or password.' };
  if (!cleanEmail || !password) return fail;

  let matchedUser: { id: string; name: string; email: string; role: string } | null = null;

  // 1. Local admin credentials store (.admin-credentials.json, or the built-in defaults)
  const stored = getStoredAdminUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (stored?.password && safeEqual(stored.password, password)) {
    matchedUser = { id: stored.id, name: stored.name, email: stored.email, role: stored.role };
  }

  // 2. Database admin accounts: verify against the Better Auth password hash
  if (!matchedUser && db) {
    try {
      const [u] = await db.select().from(user).where(eq(user.email, cleanEmail));
      if (u && (u.role === 'admin' || u.role === 'superadmin')) {
        const [cred] = await db.select().from(account).where(eq(account.userId, u.id));
        if (cred?.password) {
          const ctx = await auth.$context;
          const ok = await ctx.password.verify({ hash: cred.password, password });
          if (ok) matchedUser = { id: u.id, name: u.name, email: u.email, role: u.role };
        }
      }
    } catch (err) {
      console.error('Admin DB login check failed:', err);
    }
  }

  if (!matchedUser || (matchedUser.role !== 'admin' && matchedUser.role !== 'superadmin')) {
    return fail;
  }

  // Signed, httpOnly session cookie — set by the server so it can't be forged from the browser.
  const store = await cookies();
  store.set(ADMIN_COOKIE, createAdminToken({
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role as 'admin' | 'superadmin',
  }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return { success: true as const, user: matchedUser, message: '' };
}

/** Name / email / role of the signed-in admin, read from the signed admin session cookie. */
export async function getAdminIdentityAction() {
  const me = await requireAdmin();
  return { name: me.name, email: me.email, role: me.role };
}

export async function adminSignOutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return { success: true };
}

export async function revealAdminPasswordAction(targetEmail: string, superAdminPasswordInput: string) {
  const me = await requireAdmin({ superadmin: true });
  const list = getStoredAdminUsers();
  const self = list.find((u) => u.email.toLowerCase() === me.email.toLowerCase());
  if (!self?.password || !safeEqual(self.password, superAdminPasswordInput || '')) {
    return { success: false, message: 'Incorrect SuperAdmin password. Access denied.' };
  }

  const cleanEmail = (targetEmail || '').trim().toLowerCase();
  const matched = list.find((u) => u.email.toLowerCase() === cleanEmail);
  if (matched?.password) {
    return { success: true, password: matched.password };
  }
  return { success: false, message: 'No stored password for this account (it signs in with its database password).' };
}

export async function deleteAdminUserAction(id: string, email?: string) {
  await requireAdmin({ superadmin: true });
  try {
    if (email) {
      deleteStoredAdminUser(email);
    }
    if (db) {
      await db.delete(user).where(eq(user.id, id));
    }
    revalidatePath('/admin/settings');
    return { success: true, message: 'Admin account deleted.' };
  } catch (error) {
    console.error('Failed to delete admin user:', error);
  }
  return { success: true, message: 'Admin account deleted.' };
}



function formatHumanName(rawName: string, email: string): string {
  const n = (rawName || '').trim();
  if (n && !n.includes('@') && n.toLowerCase() !== 'valued customer') return n;

  const cleanMail = (email || '').toLowerCase().trim();
  if (cleanMail.includes('@')) {
    const localPart = cleanMail.split('@')[0];
    const parts = localPart.split(/[._-]/).filter(Boolean).filter(p => isNaN(Number(p)));
    if (parts.length > 0) {
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }
  return n || 'Valued Customer';
}

function formatValidPhone(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.length >= 10 && !digits.startsWith('01700000000')) {
    return digits.startsWith('880') ? `0${digits.slice(3)}` : digits;
  }
  return rawPhone && rawPhone.trim() ? rawPhone.trim() : 'N/A';
}

export async function fetchAdminCustomersAction() {
  await requireAdmin();
  const mergedList: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    apt?: string;
    type: string;
    ordersCount: number;
    totalSpentBdt: number;
    city: string;
    district: string;
    lastOrderDate: string;
    status: string;
  }> = [];

  try {
    if (db) {
      // 1. Fetch non-cancelled orders to calculate dynamic customer LTV directly from orders table
      const allOrders = await db.select().from(orders);
      const orderStatsByCustId = new Map<string, { count: number; spend: number; lastDate: Date | null }>();
      const orderStatsByPhone = new Map<string, { count: number; spend: number; lastDate: Date | null }>();
      const orderStatsByEmail = new Map<string, { count: number; spend: number; lastDate: Date | null }>();

      for (const o of allOrders) {
        if ((o.status || '').toLowerCase() === 'cancelled') continue;
        const spend = Number(o.totalAmount) || 0;
        const d = o.createdAt ? new Date(o.createdAt) : null;

        if (o.customerId) {
          const s = orderStatsByCustId.get(o.customerId) || { count: 0, spend: 0, lastDate: null };
          s.count += 1;
          s.spend += spend;
          if (d && (!s.lastDate || d > s.lastDate)) s.lastDate = d;
          orderStatsByCustId.set(o.customerId, s);
        }

        const p = (o.phone || '').trim().replace(/\D/g, '');
        if (p) {
          const s = orderStatsByPhone.get(p) || { count: 0, spend: 0, lastDate: null };
          s.count += 1;
          s.spend += spend;
          if (d && (!s.lastDate || d > s.lastDate)) s.lastDate = d;
          orderStatsByPhone.set(p, s);
        }

        const em = (o.email || '').trim().toLowerCase();
        if (em) {
          const s = orderStatsByEmail.get(em) || { count: 0, spend: 0, lastDate: null };
          s.count += 1;
          s.spend += spend;
          if (d && (!s.lastDate || d > s.lastDate)) s.lastDate = d;
          orderStatsByEmail.set(em, s);
        }
      }

      // 2. Fetch records from customers table
      const dbCusts = await db.select().from(customers);
      if (dbCusts.length > 0) {
        dbCusts.forEach((c) => {
          const cleanEmail = c.email || 'N/A';
          const cleanPhone = (c.phone || '').trim().replace(/\D/g, '');
          const lowerEmail = (c.email || '').trim().toLowerCase();

          const stats = (c.id && orderStatsByCustId.get(c.id))
            || (cleanPhone && orderStatsByPhone.get(cleanPhone))
            || (lowerEmail && orderStatsByEmail.get(lowerEmail))
            || { count: 0, spend: 0, lastDate: null };

          const calculatedOrdersCount = stats.count;
          const calculatedSpentBdt = stats.spend;
          const lastDateObj = stats.lastDate ?? (c.createdAt ? new Date(c.createdAt) : null);
          const lastOrderDateStr = lastDateObj
            ? lastDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent';

          const exists = mergedList.some(m => (m.phone !== 'N/A' && m.phone === c.phone) || (c.email && m.email.toLowerCase() === c.email.toLowerCase()));
          if (!exists) {
            mergedList.unshift({
              id: c.id,
              name: formatHumanName(c.fullName, cleanEmail),
              email: cleanEmail,
              phone: formatValidPhone(c.phone || ''),
              address: c.address || 'Standard Address',
              apt: c.apt || '',
              type: c.email ? 'Registered' : 'Guest',
              ordersCount: calculatedOrdersCount,
              totalSpentBdt: calculatedSpentBdt,
              city: c.city || 'Dhaka',
              district: c.district || 'Dhaka Division',
              lastOrderDate: lastOrderDateStr,
              status: calculatedOrdersCount > 3 ? 'VIP Member' : 'Active',
            });
          }
        });
      }

      // 3. Fetch records from user auth table to ensure newly registered accounts always appear
      const allUsers = await db.select().from(user);
      allUsers.forEach((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (uEmail) {
          const exists = mergedList.some(m => m.email.toLowerCase() === uEmail);
          if (!exists) {
            const rawPhone = formatValidPhone((u as any).phoneNumber || '');
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const stats = (uEmail && orderStatsByEmail.get(uEmail))
              || (cleanPhone && orderStatsByPhone.get(cleanPhone))
              || { count: 0, spend: 0, lastDate: null };

            mergedList.unshift({
              id: u.id,
              name: formatHumanName(u.name || '', uEmail),
              email: uEmail,
              phone: rawPhone,
              address: 'N/A',
              apt: '',
              type: 'Registered',
              ordersCount: stats.count,
              totalSpentBdt: stats.spend,
              city: 'Dhaka',
              district: 'Dhaka Division',
              lastOrderDate: stats.lastDate
                ? stats.lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : (u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New Account'),
              status: stats.count > 3 ? 'VIP Member' : 'Active',
            });
          }
        }
      });
    }
  } catch (err) {
    console.error("Error fetching customers from database:", err);
  }

  return mergedList;
}

export async function deleteAdminCustomerAction(targetIdentifier: string) {
  await requireAdmin();
  try {
    if (!db || !targetIdentifier) return { success: true, message: 'Target identifier missing' };
    const cleanTarget = targetIdentifier.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTarget);
    const isEmail = cleanTarget.includes('@');

    // 1. Find customer in customers table safely without triggering invalid UUID syntax error
    let existingCust = null;
    if (isUuid) {
      existingCust = await db.query.customers.findFirst({
        where: eq(customers.id, cleanTarget),
      });
    } else if (isEmail) {
      existingCust = await db.query.customers.findFirst({
        where: eq(customers.email, cleanTarget.toLowerCase()),
      });
    } else {
      existingCust = await db.query.customers.findFirst({
        where: eq(customers.phone, cleanTarget),
      });
    }

    const targetEmail = existingCust?.email || (isEmail ? cleanTarget.toLowerCase() : null);
    const targetPhone = existingCust?.phone || (!isEmail && !isUuid ? cleanTarget : null);

    // 2. Clear customerId reference in orders table so FK constraint passes
    if (existingCust?.id) {
      await db.update(orders).set({ customerId: null }).where(eq(orders.customerId, existingCust.id));
    }
    if (isUuid) {
      await db.update(orders).set({ customerId: null }).where(eq(orders.customerId, cleanTarget));
    }

    // 3. Delete matching user in Better Auth user table (and dependent sessions & accounts)
    let existingUser = null;
    if (targetEmail) {
      existingUser = await db.query.user.findFirst({
        where: eq(user.email, targetEmail),
      });
    }
    if (!existingUser && !isEmail) {
      existingUser = await db.query.user.findFirst({
        where: eq(user.id, cleanTarget),
      });
    }

    if (existingUser?.id) {
      await db.delete(session).where(eq(session.userId, existingUser.id));
      await db.delete(account).where(eq(account.userId, existingUser.id));
      await db.delete(user).where(eq(user.id, existingUser.id));
    }
    if (targetEmail) {
      await db.delete(user).where(eq(user.email, targetEmail));
    }
    if (!isEmail) {
      await db.delete(user).where(eq(user.id, cleanTarget));
    }

    // 4. Delete from customers table
    if (existingCust?.id) {
      await db.delete(customers).where(eq(customers.id, existingCust.id));
    }
    if (isUuid) {
      await db.delete(customers).where(eq(customers.id, cleanTarget));
    }
    if (targetEmail) {
      await db.delete(customers).where(eq(customers.email, targetEmail));
    }
    if (targetPhone) {
      await db.delete(customers).where(eq(customers.phone, targetPhone));
    }

    try {
      revalidatePath('/admin/customers');
    } catch (rErr) {
      // Ignore revalidatePath when executing in non-HTTP context
    }
    return { success: true, message: 'Customer record deleted.' };
  } catch (err: any) {
    console.error('Failed to delete customer:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to delete customer.' };
  }
}

// ----------------------------------------------------
// PURGE LEGACY DUMMY CUSTOMERS ACTION
// ----------------------------------------------------
export async function purgeLegacyDummyCustomersAction() {
  await requireAdmin({ superadmin: true });
  try {
    if (!db) return { success: false, error: 'Database connection missing' };

    const allOrders = await db.select().from(orders);
    const buyerEmails = new Set(allOrders.map(o => (o.email || '').toLowerCase().trim()).filter(Boolean));
    const buyerPhones = new Set(allOrders.map(o => (o.phone || '').trim()).filter(Boolean));

    const allAuthUsers = await db.select().from(user);
    const authEmails = new Set(allAuthUsers.map(u => (u.email || '').toLowerCase().trim()).filter(Boolean));

    const allCusts = await db.select().from(customers);
    for (const c of allCusts) {
      const cEmail = (c.email || '').toLowerCase().trim();
      const cPhone = (c.phone || '').trim();

      const isBuyer = buyerEmails.has(cEmail) || buyerPhones.has(cPhone);
      const isAuthUser = authEmails.has(cEmail);

      if (!isBuyer && !isAuthUser) {
        await db.delete(customers).where(eq(customers.id, c.id));
      }
    }

    revalidatePath('/admin/customers');
    return { success: true, message: 'Legacy dummy records purged successfully.' };
  } catch (err: any) {
    console.error('Failed to purge dummy customers:', err);
    return { success: false, error: err?.message || 'Purge failed.' };
  }
}

export async function createAdminCustomerAction(data: {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  apt?: string;
  city?: string;
  district?: string;
  type?: string;
}) {
  await requireAdmin();
  try {
    const cleanPhone = (data.phone || '').trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanName = (data.fullName || '').trim();

    if (!cleanName) return { success: false, message: 'Full name is required' };
    if (!BD_PHONE.test(cleanPhone.replace(/[\s-]/g, ''))) return { success: false, message: 'Enter a valid 11-digit Bangladeshi phone number.' };
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { success: false, message: 'Enter a valid email address.' };

    if (db) {
      const existing = await db.query.customers.findFirst({
        where: eq(customers.phone, cleanPhone),
      });

      if (existing) {
        return { success: false, message: `A customer with phone ${cleanPhone} already exists (${existing.fullName}).` };
      }
      {
        await db.insert(customers).values({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          address: data.address || '',
          apt: data.apt || '',
          city: data.city || 'Dhaka',
          district: data.district || 'Dhaka Division',
          totalOrdersCount: 0,
          totalSpentBdt: 0,
        });
      }
    }
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to create customer:', err);
    return { success: false, message: err?.message || 'Failed to create customer record.' };
  }
}

// ----------------------------------------------------
// 9. ANALYTICS SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminAnalyticsAction() {
  await requireAdmin();
  try {
    if (!db) {
      return {
        grossRevenueBdt: 0,
        verifiedPaidRevenueBdt: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        averageOrderValueBdt: 0,
        topProducts: [] as Array<{ name: string; units: number; revenue: number }>,
        statusBreakdown: { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 },
        paymentBreakdown: { cod: 0, bkash: 0, nagad: 0, online: 0 },
      };
    }

    const allOrders = await db.query.orders.findMany({
      with: { items: true },
    });

    const nonCancelled = allOrders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled');
    const grossRevenueBdt = nonCancelled.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    const verifiedPaidRevenueBdt = allOrders
      .filter((o) => (o.paymentStatus || '').toLowerCase().includes('paid') || (o.paymentStatus || '').toLowerCase().includes('verified'))
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
    const totalOrders = allOrders.length;
    const deliveredOrders = allOrders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length;
    const cancelledOrders = allOrders.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length;
    const averageOrderValueBdt = nonCancelled.length > 0 ? Math.round(grossRevenueBdt / nonCancelled.length) : 0;

    const statusBreakdown = {
      Pending: allOrders.filter((o) => (o.status || '').toLowerCase() === 'pending').length,
      Processing: allOrders.filter((o) => (o.status || '').toLowerCase() === 'processing').length,
      Shipped: allOrders.filter((o) => (o.status || '').toLowerCase() === 'shipped').length,
      Delivered: deliveredOrders,
      Cancelled: cancelledOrders,
    };

    const paymentBreakdown = {
      cod: allOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('cash')).length,
      bkash: allOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('bkash')).length,
      nagad: allOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('nagad')).length,
      online: allOrders.filter((o) => (o.paymentMethod || '').toLowerCase().includes('online')).length,
    };

    // Calculate product sales from non-cancelled order items
    const productSalesMap = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of nonCancelled) {
      for (const item of o.items || []) {
        const name = item.productName || 'Apparel Item';
        const existing = productSalesMap.get(name) || { name, units: 0, revenue: 0 };
        existing.units += item.quantity || 1;
        existing.revenue += (item.priceBdt || 0) * (item.quantity || 1);
        productSalesMap.set(name, existing);
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      grossRevenueBdt,
      verifiedPaidRevenueBdt,
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValueBdt,
      topProducts,
      statusBreakdown,
      paymentBreakdown,
    };
  } catch (err) {
    console.error('Failed to calculate admin analytics:', err);
    return {
      grossRevenueBdt: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      averageOrderValueBdt: 0,
      topProducts: [] as Array<{ name: string; units: number; revenue: number }>,
      statusBreakdown: { Pending: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 },
      paymentBreakdown: { cod: 0, bkash: 0, nagad: 0, online: 0 },
    };
  }
}

// ----------------------------------------------------
// 10. STORE SETTINGS & SHIPPING REGIONS ACTIONS
// ----------------------------------------------------
export async function fetchAdminStoreSettingsAction() {
  await requireAdmin();
  try {
    if (!db) return null;
    let settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    if (!settings) {
      const [created] = await db.insert(storeSettings).values({
        id: 'general',
        storeName: 'LIVUS',
        supportEmail: 'support@livus.com.bd',
        supportPhone: '+880 1711 000000',
        currency: 'BDT',
        vatPercent: 10,
        freeShippingThresholdBdt: 2500,
        defaultDeliveryChargeBdt: 150,
        bKashMerchantNumber: '',
        nagadMerchantNumber: '',
      }).returning();
      settings = created;
    }

    const regions = await db.select().from(shippingRegions).orderBy(shippingRegions.regionName);
    const admin = await requireAdmin();
    return { settings, regions, currentUserRole: admin.role };
  } catch (err) {
    console.error('Failed to fetch admin store settings:', err);
    return null;
  }
}

export async function updateAdminStoreSettingsAction(data: {
  storeName?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  vatPercent?: number;
  freeShippingThresholdBdt?: number;
  defaultDeliveryChargeBdt?: number;
  bKashMerchantNumber?: string;
  nagadMerchantNumber?: string;
}) {
  const admin = await requireAdmin();
  const intIn = (v: unknown, min: number, max: number) => v === undefined || (Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max);
  if (!intIn(data.vatPercent, 0, 50)) return { success: false, message: 'VAT must be a whole number between 0 and 50.' };
  if (!intIn(data.freeShippingThresholdBdt, 0, 1000000)) return { success: false, message: 'Free delivery threshold must be 0 or more.' };
  if (!intIn(data.defaultDeliveryChargeBdt, 0, 10000)) return { success: false, message: 'Default delivery fee must be between 0 and 10,000.' };
  for (const [label, v] of [['bKash', data.bKashMerchantNumber], ['Nagad', data.nagadMerchantNumber]] as const) {
    if (v !== undefined && v.trim() !== '' && !/^01[3-9]\d{8}$/.test(v.trim())) {
      return { success: false, message: `${label} number must be a valid 11-digit Bangladeshi mobile number.` };
    }
  }
  if (data.supportEmail !== undefined && data.supportEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail.trim())) {
    return { success: false, message: 'Support email is not a valid email address.' };
  }
  try {
    if (!db) return { success: false, message: 'Database not initialized' };

    // Fetch existing settings to check if financial merchant numbers are being altered
    const existing = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    const isBkashChanged = data.bKashMerchantNumber !== undefined && (data.bKashMerchantNumber || '') !== (existing?.bKashMerchantNumber || '');
    const isNagadChanged = data.nagadMerchantNumber !== undefined && (data.nagadMerchantNumber || '') !== (existing?.nagadMerchantNumber || '');

    // C2: Only superadmin can modify bKash and Nagad payment numbers
    if ((isBkashChanged || isNagadChanged) && admin.role !== 'superadmin') {
      return {
        success: false,
        message: 'Security policy violation: Only a superadmin can modify bKash and Nagad payment numbers.',
      };
    }

    if (isBkashChanged || isNagadChanged) {
      console.log(`[AUDIT] Payment merchant numbers updated by ${admin.email} (role: ${admin.role}) at ${new Date().toISOString()}: bKash="${data.bKashMerchantNumber}", Nagad="${data.nagadMerchantNumber}"`);
    }

    if (data.bKashMerchantNumber && data.bKashMerchantNumber.trim() && !/^01[3-9]\d{8}$/.test(data.bKashMerchantNumber.trim())) {
      return { success: false, message: 'Please enter a valid 11-digit Bangladeshi mobile number for bKash (e.g. 01712345678).' };
    }
    if (data.nagadMerchantNumber && data.nagadMerchantNumber.trim() && !/^01[3-9]\d{8}$/.test(data.nagadMerchantNumber.trim())) {
      return { success: false, message: 'Please enter a valid 11-digit Bangladeshi mobile number for Nagad (e.g. 01812345678).' };
    }
    await db.insert(storeSettings).values({
      id: 'general',
      storeName: data.storeName || 'LIVUS',
      supportEmail: data.supportEmail || 'support@livus.com.bd',
      supportPhone: data.supportPhone || '+880 1711 000000',
      currency: data.currency || 'BDT',
      vatPercent: data.vatPercent ?? 10,
      freeShippingThresholdBdt: data.freeShippingThresholdBdt ?? 2500,
      defaultDeliveryChargeBdt: data.defaultDeliveryChargeBdt ?? 150,
      bKashMerchantNumber: data.bKashMerchantNumber || '',
      nagadMerchantNumber: data.nagadMerchantNumber || '',
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: storeSettings.id,
      set: {
        ...(data.storeName !== undefined ? { storeName: data.storeName } : {}),
        ...(data.supportEmail !== undefined ? { supportEmail: data.supportEmail } : {}),
        ...(data.supportPhone !== undefined ? { supportPhone: data.supportPhone } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.vatPercent !== undefined ? { vatPercent: data.vatPercent } : {}),
        ...(data.freeShippingThresholdBdt !== undefined ? { freeShippingThresholdBdt: data.freeShippingThresholdBdt } : {}),
        ...(data.defaultDeliveryChargeBdt !== undefined ? { defaultDeliveryChargeBdt: data.defaultDeliveryChargeBdt } : {}),
        ...(data.bKashMerchantNumber !== undefined ? { bKashMerchantNumber: data.bKashMerchantNumber } : {}),
        ...(data.nagadMerchantNumber !== undefined ? { nagadMerchantNumber: data.nagadMerchantNumber } : {}),
        updatedAt: new Date(),
      },
    });

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Store settings saved successfully' };
  } catch (err) {
    console.error('Failed to update store settings:', err);
    return { success: false, message: 'Failed to update store settings' };
  }
}

export async function updateAdminShippingRegionAction(id: string, deliveryChargeBdt: number) {
  await requireAdmin();
  const fee = Number(deliveryChargeBdt);
  if (!Number.isInteger(fee) || fee < 0 || fee > 10000) {
    return { success: false, message: 'Delivery fee must be a whole number between 0 and 10,000.' };
  }
  deliveryChargeBdt = fee;
  try {
    if (!db) return { success: false, message: 'Database not initialized' };
    await db.update(shippingRegions).set({
      deliveryChargeBdt,
    }).where(eq(shippingRegions.id, id));

    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    return { success: true, message: 'Shipping zone updated' };
  } catch (err) {
    console.error('Failed to update shipping zone:', err);
    return { success: false, message: 'Failed to update shipping zone' };
  }
}

