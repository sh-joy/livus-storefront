'use server';

import { randomInt } from 'crypto';
import { db } from '@/db';
import { customers, orders, orderItems } from '@/db/schema';
import { CheckoutFormSchema, type CheckoutFormValues } from '@/lib/validations';
import { quoteOrder, reserveStock, releaseStock, type QuoteItemInput } from '@/lib/order-pricing';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

/** Live order summary for the checkout page — computed by the same code that saves the order. */
export async function getCheckoutQuoteAction(items: QuoteItemInput[], promoCode?: string) {
  try {
    const res = await quoteOrder(items, promoCode);
    if (!res.ok) return { success: false as const, message: res.message };
    const q = res.quote;
    return {
      success: true as const,
      subtotalBdt: q.subtotalBdt,
      discountBdt: q.discountBdt,
      vatBdt: q.vatBdt,
      vatPercent: q.vatPercent,
      deliveryChargeBdt: q.deliveryChargeBdt,
      totalBdt: q.totalBdt,
      promo: q.promo,
      promoError: q.promoError,
    };
  } catch (err) {
    console.error('Checkout quote error:', err);
    return { success: false as const, message: 'Could not calculate your order total. Please try again.' };
  }
}

async function generateOrderNumber(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = `LIV-${randomInt(100000, 1000000)}`;
    const clash = await db.query.orders.findFirst({ where: eq(orders.orderNumber, candidate), columns: { id: true } });
    if (!clash) return candidate;
  }
  return `LIV-${Date.now().toString().slice(-8)}`;
}

export async function placeOrderAction(data: CheckoutFormValues & { promoCode?: string }) {
  // 1. Validate the form payload
  const parseResult = CheckoutFormSchema.safeParse(data);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message || 'Invalid checkout payload';
    return { success: false, message: firstError };
  }
  const payload = parseResult.data;

  if (!db) {
    return { success: false, message: 'The store database is not configured. Please try again later.' };
  }

  // 2. Re-price everything on the server from the database (never trust browser prices)
  const quoteRes = await quoteOrder(
    payload.cartItems.map((i) => ({
      productId: i.productId,
      variantName: i.variantName,
      size: i.size,
      quantity: i.quantity,
    })),
    data.promoCode
  );
  if (!quoteRes.ok) return { success: false, message: quoteRes.message };
  const quote = quoteRes.quote;
  if (data.promoCode && data.promoCode.trim() && quote.promoError) {
    return { success: false, message: quote.promoError };
  }

  const cleanPhone = payload.phone.trim().replace(/[\s-]/g, '');
  const cleanName = payload.fullName.trim();
  const cleanEmail = payload.email ? payload.email.trim().toLowerCase() : null;
  const cleanStreet = payload.streetAddress ? payload.streetAddress.trim() : '';
  const cleanApt = payload.aptSuite ? payload.aptSuite.trim() : '';
  const fullShippingAddress = [cleanStreet, cleanApt ? `Apt/Suite: ${cleanApt}` : ''].filter(Boolean).join(', ');
  const cleanCity = payload.city ? payload.city.trim() : '';
  const cleanRegion = payload.stateRegion.trim();
  const cleanZip = payload.zipCode ? payload.zipCode.trim() : '';

  if (!fullShippingAddress) {
    return { success: false, message: 'Street address is required for delivery.' };
  }

  // 3. Take the stock first so two people can't buy the last unit at the same time
  const reserved = await reserveStock(quote.lines);
  if (!reserved.ok) return { success: false, message: reserved.message };
  const reservedRows = quote.lines.filter((l) => l.stockRowId).map((l) => ({ id: l.stockRowId!, qty: l.quantity }));

  try {
    const orderNum = await generateOrderNumber();
    const isOnline = payload.paymentMethod === 'online';

    // 4. Insert order + items
    const [newOrder] = await db.insert(orders).values({
      orderNumber: orderNum,
      customerId: null,
      customerName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      shippingAddress: fullShippingAddress,
      city: cleanCity,
      district: cleanRegion,
      postalCode: cleanZip,
      deliveryInstructions: [
        payload.deliveryInstructions?.trim(),
        quote.promo ? `Promo: ${quote.promo.code}` : '',
      ].filter(Boolean).join(' | ') || null,
      subtotalBdt: quote.subtotalBdt,
      vatBdt: quote.vatBdt,
      deliveryChargeBdt: quote.deliveryChargeBdt,
      discountBdt: quote.discountBdt,
      totalAmount: quote.totalBdt.toString(),
      paymentMethod: isOnline ? 'Online Payment' : 'Cash on Delivery',
      status: 'Pending',
      // No payment gateway is connected yet, so an "online" order is NOT paid until staff confirm it.
      paymentStatus: isOnline ? 'Awaiting Payment (Online)' : 'Unpaid (COD)',
    }).returning();

    try {
      await db.insert(orderItems).values(
        // quote.lines is built 1:1 in the same order as payload.cartItems
        quote.lines.map((l, idx) => ({
          orderId: newOrder.id,
          productId: l.productId,
          productName: l.productName,
          variantName: l.variantName,
          size: l.size,
          thumbnailUrl: payload.cartItems[idx]?.thumbnailUrl || l.thumbnailUrl || '/images/for_him.jpg',
          quantity: l.quantity,
          priceBdt: l.unitPriceBdt,
          price: l.unitPriceBdt.toString(),
        }))
      );
    } catch (itemErr) {
      await db.delete(orders).where(eq(orders.id, newOrder.id));
      throw itemErr;
    }

    // 5. Upsert the CRM customer record (non-fatal) and link it to the order
    try {
      const existingCustomer = await db.query.customers.findFirst({ where: eq(customers.phone, cleanPhone) });
      let customerId: string | null = null;
      if (existingCustomer) {
        customerId = existingCustomer.id;
        await db.update(customers).set({
          fullName: cleanName,
          email: cleanEmail || existingCustomer.email,
          address: fullShippingAddress,
          city: cleanCity,
          district: cleanRegion,
          postalCode: cleanZip || existingCustomer.postalCode,
          totalOrdersCount: (existingCustomer.totalOrdersCount || 0) + 1,
          totalSpentBdt: (existingCustomer.totalSpentBdt || 0) + quote.totalBdt,
          updatedAt: new Date(),
        }).where(eq(customers.id, existingCustomer.id));
      } else {
        const [newCust] = await db.insert(customers).values({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          address: fullShippingAddress,
          city: cleanCity,
          district: cleanRegion,
          postalCode: cleanZip,
          totalOrdersCount: 1,
          totalSpentBdt: quote.totalBdt,
        }).returning();
        customerId = newCust?.id ?? null;
      }
      if (customerId) {
        await db.update(orders).set({ customerId }).where(eq(orders.id, newOrder.id));
      }
    } catch (custErr) {
      console.warn('Customer upsert non-fatal warning:', custErr);
    }

    try {
      revalidatePath('/admin/orders');
      revalidatePath('/admin/customers');
      revalidatePath('/profile');
    } catch {
      // revalidatePath can throw outside a request context; safe to ignore
    }

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalAmount: quote.totalBdt,
      message: 'Order placed successfully!',
    };
  } catch (error) {
    console.error('Database operation error when placing order:', error);
    await releaseStock(reservedRows);
    return {
      success: false,
      message: 'Failed to place order due to a database connection error. Please try again.',
    };
  }
}
