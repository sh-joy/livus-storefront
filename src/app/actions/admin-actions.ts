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
          paymentTrxId: o.paymentTrxId || '',
          paymentSenderPhone: o.paymentSenderPhone || '',
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
export async function verifyOrderPaymentAction(
  orderId: string,
  action: 'verify' | 'not_received' | 'reject',
  cancelOrder?: boolean
) {
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
      newPaymentStatus = 'Paid (Verified)';
      await db.update(orders).set({ paymentStatus: newPaymentStatus }).where(eq(orders.id, orderId));
      try {
        await db.execute(
          sql`UPDATE orders SET payment_verified_by = ${admin.email}, payment_verified_at = NOW() WHERE id = ${orderId}`
        );
      } catch {
        // Safe fallback if migration 0009 has not yet been applied to database
      }
    } else {
      newPaymentStatus = 'Payment not received';
      if (cancelOrder) {
        // Release stock and cancel order if explicitly requested
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
        // Order stays and is NOT cancelled automatically
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
      const existing = await db.query.orders.findFirst({ where: eq(orders.id, data.orderId) });
      if (!existing) return { success: false, message: 'Order not found' };

      const method = (existing.paymentMethod || '').toLowerCase();
      let updatedPaymentStatus = existing.paymentStatus;
      if (method.includes('cash') || method.includes('cod')) {
        updatedPaymentStatus = data.status === 'Delivered' ? 'Paid (COD Collected)' : 'Unpaid (COD)';
      }

      await db.update(orders).set({
        customerName: data.customerName.trim(),
        phone: data.phone.trim(),
        email: data.email ? data.email.trim() : null,
        shippingAddress: data.shippingAddress.trim(),
        city: data.city ? data.city.trim() : '',
        district: data.district ? data.district.trim() : '',
        status: data.status,
        paymentStatus: updatedPaymentStatus,
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
//
// Admins are rows in the Better Auth `user` table with role 'admin' | 'superadmin'. Their
// password lives (hashed, via Better Auth's hasher) on the `account` row with
// providerId 'credential'. The optional `.admin-credentials.json` file is a LOCAL
// DEVELOPMENT convenience only and is ignored entirely in production.

const CREDENTIALS_FILE = path.join(process.cwd(), '.admin-credentials.json');
type AdminRole = 'admin' | 'superadmin';
const ADMIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isAdminRole = (r: unknown): r is AdminRole => r === 'admin' || r === 'superadmin';

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

/**
 * Dev only: drop an email from the local credentials file so a stale plaintext entry can't
 * shadow (or outlive) the database account. New passwords are never written to the file.
 */
function deleteStoredAdminUser(emailToDelete: string) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return;
    const list = getStoredAdminUsers();
    const cleanEmail = emailToDelete.trim().toLowerCase();
    const filtered = list.filter(u => (u.email || '').toLowerCase() !== cleanEmail);
    if (filtered.length !== list.length) {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error updating .admin-credentials.json:", err);
  }
}

/** Returns an error message, or null when the password is acceptable. */
async function validateAdminPassword(password: string): Promise<string | null> {
  const ctx = await auth.$context;
  const min = Math.max(8, ctx.password.config.minPasswordLength || 8);
  const max = ctx.password.config.maxPasswordLength || 128;
  if (typeof password !== 'string' || password.length < min) {
    return `Password must be at least ${min} characters.`;
  }
  if (password.length > max) return `Password must be at most ${max} characters.`;
  return null;
}

/** Hash with Better Auth and set (or create) the user's credential account password. */
async function setCredentialPassword(userId: string, plainPassword: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(plainPassword);
  const accounts = await ctx.internalAdapter.findAccounts(userId);
  if (accounts.some((a) => a.providerId === 'credential')) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.createAccount({
      userId,
      providerId: 'credential',
      accountId: userId,
      password: hash,
    });
  }
}

async function getCredentialHash(userId: string): Promise<string | null> {
  const [cred] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')));
  return cred?.password || null;
}

async function findUserByEmail(email: string) {
  const [u] = await db.select().from(user).where(eq(user.email, email.trim().toLowerCase()));
  return u || null;
}

async function countSuperadmins(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.role, 'superadmin'));
  return Number(count) || 0;
}

export async function fetchAdminUsersAction() {
  const me = await requireAdmin();
  const myEmail = me.email.toLowerCase();
  const result: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    hasPassword: boolean;
    isSelf: boolean;
  }[] = [];
  const seen = new Set<string>();

  try {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(sql`${user.role} in ('admin', 'superadmin')`)
      .orderBy(desc(user.role), user.createdAt);

    // Which admins have a password (never read the hash itself into the response).
    const withPassword = new Set(
      (
        await db
          .select({ userId: account.userId })
          .from(account)
          .where(and(eq(account.providerId, 'credential'), sql`${account.password} is not null`))
      ).map((a) => a.userId)
    );

    for (const u of rows) {
      const clean = u.email.toLowerCase();
      seen.add(clean);
      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        hasPassword: withPassword.has(u.id),
        isSelf: clean === myEmail,
      });
    }
  } catch (error) {
    console.error('Error fetching admin users from DB:', error);
  }

  // Dev only: show admins that exist solely in the local credentials file.
  for (const u of getStoredAdminUsers()) {
    const clean = (u.email || '').toLowerCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push({
      id: u.id,
      name: `${u.name} (local dev file)`,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      hasPassword: !!u.password,
      isSelf: clean === myEmail,
    });
  }

  return result;
}

export async function createAdminUserAction(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const me = await requireAdmin({ superadmin: true });
  try {
    const cleanName = (data?.name || '').trim();
    const cleanEmail = (data?.email || '').trim().toLowerCase();
    const role = data?.role || 'admin';

    if (cleanName.length < 2) return { success: false, message: 'Name must be at least 2 characters.' };
    if (!ADMIN_EMAIL_RE.test(cleanEmail)) return { success: false, message: 'Please enter a valid email address.' };
    if (!isAdminRole(role)) return { success: false, message: 'Role must be admin or superadmin.' };
    const pwError = await validateAdminPassword(data?.password);
    if (pwError) return { success: false, message: pwError };

    if (cleanEmail === me.email.toLowerCase()) {
      return { success: false, message: 'You cannot modify your own account here. Use "Set new password" instead.' };
    }

    const ctx = await auth.$context;
    const existing = await findUserByEmail(cleanEmail);
    let userId: string;

    if (existing) {
      if (existing.role === 'superadmin' && role !== 'superadmin' && (await countSuperadmins()) <= 1) {
        return { success: false, message: 'Cannot demote the last remaining superadmin.' };
      }
      await db.update(user).set({
        name: cleanName,
        role,
        emailVerified: true,
        updatedAt: new Date(),
      }).where(eq(user.id, existing.id));
      userId = existing.id;
    } else {
      const created = await ctx.internalAdapter.createUser({
        name: cleanName,
        email: cleanEmail,
        emailVerified: true,
        role,
      });
      userId = created.id;
      // Make sure the role is persisted even if the adapter drops unknown input fields.
      await db.update(user).set({ role }).where(eq(user.id, userId));
    }

    await setCredentialPassword(userId, data.password);
    if (existing) {
      // An upgraded account gets a new password, so sign it out everywhere.
      await ctx.internalAdapter.deleteUserSessions(userId);
    }
    deleteStoredAdminUser(cleanEmail);

    revalidatePath('/admin/settings');
    return {
      success: true,
      message: existing
        ? `${cleanEmail} is now an ${role} and their password has been set.`
        : `Admin account created for ${cleanEmail}.`,
    };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return { success: false, message: 'Failed to create admin user.' };
  }
}

export async function verifyAdminLoginAction(email: string, pass: string) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const password = pass || '';
  const fail = { success: false as const, message: 'Invalid administrative email or password.' };
  if (!cleanEmail || !password) return fail;

  let matchedUser: { id: string; name: string; email: string; role: string } | null = null;

  // 1. Local admin credentials file (development only — always empty in production)
  const stored = getStoredAdminUsers().find((u) => (u.email || '').toLowerCase() === cleanEmail);
  if (stored?.password && safeEqual(stored.password, password)) {
    matchedUser = { id: stored.id, name: stored.name, email: stored.email, role: stored.role };
  }

  // 2. Database admin accounts: verify against the Better Auth credential password hash
  if (!matchedUser && db) {
    try {
      const u = await findUserByEmail(cleanEmail);
      if (u && isAdminRole(u.role)) {
        const hash = await getCredentialHash(u.id);
        if (hash) {
          const ctx = await auth.$context;
          const ok = await ctx.password.verify({ hash, password });
          if (ok) matchedUser = { id: u.id, name: u.name, email: u.email, role: u.role };
        }
      }
    } catch (err) {
      console.error('Admin DB login check failed:', err);
    }
  }

  if (!matchedUser || !isAdminRole(matchedUser.role)) {
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

/**
 * Superadmin only. Sets a new password on another (or their own) admin account.
 * The caller must re-enter their OWN current password as identity confirmation.
 * Never returns or logs any password.
 */
export async function setAdminPasswordAction(
  targetEmail: string,
  newPassword: string,
  currentSuperAdminPassword: string,
) {
  const me = await requireAdmin({ superadmin: true });
  try {
    if (!currentSuperAdminPassword) {
      return { success: false, message: 'Enter your current password to confirm your identity.' };
    }

    // 1. Confirm the caller's identity against their own database password hash.
    const self = await findUserByEmail(me.email);
    const selfHash = self && self.role === 'superadmin' ? await getCredentialHash(self.id) : null;
    if (!self || !selfHash) {
      return {
        success: false,
        message: 'Your superadmin account has no database password yet. Set one with "npm run admin:set-password" first.',
      };
    }
    const ctx = await auth.$context;
    const ok = await ctx.password.verify({ hash: selfHash, password: currentSuperAdminPassword });
    if (!ok) return { success: false, message: 'Your current password is incorrect.' };

    // 2. Validate the new password and the target.
    const pwError = await validateAdminPassword(newPassword);
    if (pwError) return { success: false, message: pwError };

    const cleanTarget = (targetEmail || '').trim().toLowerCase();
    const target = cleanTarget ? await findUserByEmail(cleanTarget) : null;
    if (!target || !isAdminRole(target.role)) {
      return { success: false, message: 'No admin account found for that email.' };
    }

    // 3. Hash + set (creates the credential account if missing), then revoke sessions.
    await setCredentialPassword(target.id, newPassword);
    await ctx.internalAdapter.deleteUserSessions(target.id);
    deleteStoredAdminUser(cleanTarget);

    revalidatePath('/admin/settings');
    return { success: true, message: `New password set for ${target.email}.` };
  } catch (error) {
    console.error('Failed to set admin password:', error);
    return { success: false, message: 'Failed to set the new password.' };
  }
}

export async function deleteAdminUserAction(id: string, email?: string) {
  const me = await requireAdmin({ superadmin: true });
  try {
    const myEmail = me.email.toLowerCase();
    const [target] = id ? await db.select().from(user).where(eq(user.id, id)) : [];

    if (!target) {
      // Dev only: an admin that exists solely in the local credentials file.
      const cleanEmail = (email || '').trim().toLowerCase();
      if (process.env.NODE_ENV !== 'production' && cleanEmail && cleanEmail !== myEmail &&
          getStoredAdminUsers().some((u) => (u.email || '').toLowerCase() === cleanEmail)) {
        deleteStoredAdminUser(cleanEmail);
        revalidatePath('/admin/settings');
        return { success: true, message: 'Admin account deleted.' };
      }
      return { success: false, message: 'Admin account not found.' };
    }

    if (target.email.toLowerCase() === myEmail) {
      return { success: false, message: 'You cannot delete your own account.' };
    }
    if (!isAdminRole(target.role)) {
      return { success: false, message: 'That account is not an admin.' };
    }
    if (target.role === 'superadmin' && (await countSuperadmins()) <= 1) {
      return { success: false, message: 'Cannot delete the last remaining superadmin.' };
    }

    // session/account rows also cascade on user delete; removed explicitly for clarity.
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUserSessions(target.id);
    await db.delete(account).where(eq(account.userId, target.id));
    await db.delete(user).where(eq(user.id, target.id));
    deleteStoredAdminUser(target.email);

    revalidatePath('/admin/settings');
    return { success: true, message: 'Admin account deleted.' };
  } catch (error) {
    console.error('Failed to delete admin user:', error);
    return { success: false, message: 'Failed to delete admin account.' };
  }
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
        supportPhone: '',
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
      supportPhone: data.supportPhone || '',
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

