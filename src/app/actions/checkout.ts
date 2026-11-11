'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { randomInt } from 'crypto';
import { db } from '@/db';
import { customers, orders, orderItems, abandonedCheckouts, storeSettings } from '@/db/schema';
import { CheckoutFormSchema, type CheckoutFormValues } from '@/lib/validations';
import { quoteOrder, reserveStock, releaseStock, type QuoteItemInput } from '@/lib/order-pricing';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { signOrderConfirmationToken } from '@/lib/order-token';
import { eq, or } from 'drizzle-orm';

/** Live order summary for the checkout page — computed by the same code that saves the order. */
export async function getCheckoutQuoteAction(
  items: QuoteItemInput[],
  promoCode?: string,
  divisionOrRegion?: string
) {
  try {
    const res = await quoteOrder(items, promoCode, divisionOrRegion);
    if (!res.ok) return { success: false as const, message: res.message };
    const q = res.quote;
    return {
      success: true as const,
      subtotalBdt: q.subtotalBdt,
      discountBdt: q.discountBdt,
      vatBdt: q.vatBdt,
      vatPercent: q.vatPercent,
      deliveryChargeBdt: q.deliveryChargeBdt,
      standardDeliveryChargeBdt: q.standardDeliveryChargeBdt,
      freeShippingThresholdBdt: q.freeShippingThresholdBdt,
      freeShippingEligible: q.freeShippingEligible,
      amountNeededForFreeShippingBdt: q.amountNeededForFreeShippingBdt,
      totalBdt: q.totalBdt,
      promo: q.promo,
      promoError: q.promoError,
    };
  } catch (err) {
    console.error('Checkout quote error:', err);
    return { success: false as const, message: 'Could not calculate your order total. Please try again.' };
  }
}

export async function fetchStoreSettingsAction() {
  try {
    if (!db) return null;
    const settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    return settings || null;
  } catch (err) {
    console.error('Failed to fetch store settings:', err);
    return null;
  }
}

export async function saveAbandonedCheckoutAction(data: {
  customerName?: string;
  phone?: string;
  email?: string;
  items: QuoteItemInput[];
  subtotalBdt?: number;
}) {
  const rate = await checkRateLimit('abandoned_checkout', 20, 60000);
  if (!rate.success) return { success: false };

  // Cap items to prevent payload abuse
  if (!data.items || !Array.isArray(data.items) || data.items.length > 25) {
    return { success: false };
  }
  try {
    if (!db || (!data.phone && !data.email)) return { success: false };
    const cleanPhone = (data.phone || '').trim().replace(/[\s-]/g, '');
    const cleanEmail = (data.email || '').trim().toLowerCase();

    const existing = cleanPhone
      ? await db.query.abandonedCheckouts.findFirst({ where: eq(abandonedCheckouts.phone, cleanPhone) })
      : null;

    if (existing) {
      if (!existing.isRecovered) {
        await db.update(abandonedCheckouts).set({
          customerName: data.customerName || existing.customerName,
          email: cleanEmail || existing.email,
          itemsJson: JSON.stringify(data.items),
          subtotalBdt: data.subtotalBdt ?? existing.subtotalBdt,
          updatedAt: new Date(),
        }).where(eq(abandonedCheckouts.id, existing.id));
      }
    } else {
      await db.insert(abandonedCheckouts).values({
        customerName: data.customerName || null,
        phone: cleanPhone || null,
        email: cleanEmail || null,
        itemsJson: JSON.stringify(data.items),
        subtotalBdt: data.subtotalBdt || 0,
        isRecovered: false,
      });
    }
    return { success: true };
  } catch (err) {
    console.warn('Abandoned checkout autosave non-fatal warning:', err);
    return { success: false };
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
  // Track 1: Rate limit order placement to prevent automated checkout spam
  const rate = await checkRateLimit('place_order', 5, 60000);
  if (!rate.success) {
    return { success: false, message: 'Too many order attempts. Please wait a minute and try again.' };
  }

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

  // 2. Re-price everything on the server from the database (tiered shipping + promo + stock check)
  const quoteRes = await quoteOrder(
    payload.cartItems.map((i) => ({
      productId: i.productId,
      variantName: i.variantName,
      size: i.size,
      quantity: i.quantity,
    })),
    data.promoCode,
    payload.stateRegion
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

  // E1 & P0.2 & P0.3: Enforce configured merchant numbers & unique TrxID check BEFORE taking stock
  const storeSettingsRow = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });

  let paymentMethodLabel = 'Cash on Delivery';
  let paymentStatusLabel = 'Unpaid (COD)';
  let verifiedTrxId: string | null = null;
  let verifiedSenderPhone: string | null = null;

  if (payload.paymentMethod === 'bkash') {
    const configuredNumber = (storeSettingsRow?.bKashMerchantNumber || '').trim();
    if (!/^01[3-9]\d{8}$/.test(configuredNumber)) {
      return { success: false, message: 'bKash payments are currently unavailable. Please choose Cash on Delivery.' };
    }
    const cleanTrx = (payload.trxId || '').trim().toUpperCase();
    if (!cleanTrx || !/^[A-Za-z0-9]{8,16}$/.test(cleanTrx)) {
      return { success: false, message: 'Please provide a valid 8-16 character alphanumeric bKash Transaction ID (TrxID).' };
    }
    const existingTrx = await db.query.orders.findFirst({
      where: eq(orders.paymentTrxId, cleanTrx),
    });
    if (existingTrx) {
      return { success: false, message: 'This Transaction ID has already been submitted for another order. Please check and try again.' };
    }
    verifiedTrxId = cleanTrx;
    verifiedSenderPhone = payload.senderPhone ? payload.senderPhone.trim().replace(/\D/g, '') : null;
    paymentMethodLabel = 'bKash (Manual)';
    paymentStatusLabel = 'Awaiting Verification';
  } else if (payload.paymentMethod === 'nagad') {
    const configuredNumber = (storeSettingsRow?.nagadMerchantNumber || '').trim();
    if (!/^01[3-9]\d{8}$/.test(configuredNumber)) {
      return { success: false, message: 'Nagad payments are currently unavailable. Please choose Cash on Delivery.' };
    }
    const cleanTrx = (payload.trxId || '').trim().toUpperCase();
    if (!cleanTrx || !/^[A-Za-z0-9]{8,16}$/.test(cleanTrx)) {
      return { success: false, message: 'Please provide a valid 8-16 character alphanumeric Nagad Transaction ID (TrxID).' };
    }
    const existingTrx = await db.query.orders.findFirst({
      where: eq(orders.paymentTrxId, cleanTrx),
    });
    if (existingTrx) {
      return { success: false, message: 'This Transaction ID has already been submitted for another order. Please check and try again.' };
    }
    verifiedTrxId = cleanTrx;
    verifiedSenderPhone = payload.senderPhone ? payload.senderPhone.trim().replace(/\D/g, '') : null;
    paymentMethodLabel = 'Nagad (Manual)';
    paymentStatusLabel = 'Awaiting Verification';
  } else if (payload.paymentMethod === 'online') {
    paymentMethodLabel = 'Online Payment';
    paymentStatusLabel = 'Awaiting Payment (Online)';
  }

  // 3. Take the stock atomically only AFTER all payment validations pass
  const reserved = await reserveStock(quote.lines);
  if (!reserved.ok) return { success: false, message: reserved.message };
  const reservedRows = quote.lines.filter((l) => l.stockRowId).map((l) => ({ id: l.stockRowId!, qty: l.quantity }));

  try {
    const orderNum = await generateOrderNumber();

    const instructions = [
      payload.deliveryInstructions?.trim(),
      payload.trxId ? `TrxID: ${payload.trxId.trim()}` : '',
      payload.senderPhone ? `Sender Phone: ${payload.senderPhone.trim()}` : '',
      quote.promo ? `Promo: ${quote.promo.code}` : '',
    ].filter(Boolean).join(' | ') || null;

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
      deliveryInstructions: instructions,
      subtotalBdt: quote.subtotalBdt,
      vatBdt: quote.vatBdt,
      deliveryChargeBdt: quote.deliveryChargeBdt,
      discountBdt: quote.discountBdt,
      totalAmount: quote.totalBdt.toString(),
      paymentMethod: paymentMethodLabel,
      status: 'Pending',
      paymentStatus: paymentStatusLabel,
      paymentTrxId: verifiedTrxId,
      paymentSenderPhone: verifiedSenderPhone,
      promoCode: quote.promo ? quote.promo.code : null,
    }).returning();

    try {
      await db.insert(orderItems).values(
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

    // 5. Upsert CRM customer record and link it to the order
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

    // 6. Mark any abandoned checkouts from this customer as recovered (match phone OR email)
    try {
      const recoverConditions = [];
      if (cleanPhone) recoverConditions.push(eq(abandonedCheckouts.phone, cleanPhone));
      if (cleanEmail) recoverConditions.push(eq(abandonedCheckouts.email, cleanEmail));
      if (recoverConditions.length > 0) {
        await db.update(abandonedCheckouts).set({
          isRecovered: true,
          recoveredAt: new Date(),
        }).where(or(...recoverConditions));
      }
    } catch (abandonErr) {
      console.warn('Abandoned checkout mark recovered non-fatal warning:', abandonErr);
    }

    // 7. Dispatch instant order confirmation email with rich HTML invoice
    if (cleanEmail) {
      sendOrderConfirmationEmail({
        to: cleanEmail,
        customerName: cleanName,
        orderNumber: newOrder.orderNumber,
        items: quote.lines.map((l) => ({
          productName: l.productName,
          variantName: l.variantName,
          size: l.size,
          quantity: l.quantity,
          priceBdt: l.unitPriceBdt,
        })),
        subtotalBdt: quote.subtotalBdt,
        deliveryChargeBdt: quote.deliveryChargeBdt,
        discountBdt: quote.discountBdt,
        vatBdt: quote.vatBdt,
        totalBdt: quote.totalBdt,
        shippingAddress: `${fullShippingAddress}, ${cleanCity ? `${cleanCity}, ` : ''}${cleanRegion}`,
        paymentMethod: paymentMethodLabel,
      }).catch((emailErr) => {
        console.warn('Order confirmation email non-fatal warning:', emailErr);
      });
    }

    try {
      revalidatePath('/admin/orders');
      revalidatePath('/admin/customers');
      revalidatePath('/admin/abandoned-carts');
      revalidatePath('/profile');
    } catch {
      // safe outside HTTP request context
    }

    // Set signed confirmation cookie to allow guest access to order-confirmed details (SQA M5)
    try {
      const confirmToken = signOrderConfirmationToken(newOrder.orderNumber, cleanPhone);
      const cookieStore = await cookies();
      cookieStore.set('livus_order_confirm', confirmToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutes
        path: '/',
      });
    } catch (cookieErr) {
      console.warn('Failed to set confirmation cookie:', cookieErr);
    }

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalAmount: quote.totalBdt,
      paymentMethod: paymentMethodLabel,
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
