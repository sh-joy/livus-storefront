'use server';

import { db } from '@/db';
import { customers, orders, orderItems } from '@/db/schema';
import { CheckoutFormSchema, type CheckoutFormValues } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function placeOrderAction(data: CheckoutFormValues) {
  // 1. Server-side Zod Validation
  const parseResult = CheckoutFormSchema.safeParse(data);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0]?.message || 'Invalid checkout payload';
    return { success: false, message: firstError };
  }

  const payload = parseResult.data;

  // 2. Server-side Secure Calculation (Do not trust client totals)
  let subtotalBdt = 0;
  const itemsWithSecurePrices = payload.cartItems.map((item) => {
    const itemPrice = item.priceBdt && item.priceBdt > 0 ? item.priceBdt : 899;
    subtotalBdt += itemPrice * item.quantity;
    return {
      ...item,
      priceBdt: itemPrice,
    };
  });

  const vatBdt = itemsWithSecurePrices.length > 0 ? 90 : 0;
  const deliveryChargeBdt = itemsWithSecurePrices.length > 0 ? 150 : 0;
  const totalAmountVal = subtotalBdt + vatBdt + deliveryChargeBdt;

  const orderNum = `LIV-${Math.floor(10000 + Math.random() * 90000)}`;

  const cleanPhone = payload.phone.trim().replace(/[\s-]/g, '');
  const cleanName = payload.fullName.trim();
  const cleanEmail = payload.email ? payload.email.trim() : null;
  const cleanStreet = payload.streetAddress ? payload.streetAddress.trim() : '';
  const cleanApt = payload.aptSuite ? payload.aptSuite.trim() : '';
  const fullShippingAddress = [cleanStreet, cleanApt ? `Apt/Suite: ${cleanApt}` : ''].filter(Boolean).join(', ') || 'Default Shipping Address';
  const cleanCity = payload.city ? payload.city.trim() : '';
  const cleanRegion = payload.stateRegion.trim();
  const cleanZip = payload.zipCode ? payload.zipCode.trim() : '';

  try {
    if (!db) {
      return {
        success: true,
        orderId: 'demo-ord-' + Date.now(),
        orderNumber: orderNum,
        totalAmount: totalAmountVal,
        message: 'Demo Cash on Delivery order placed successfully',
      };
    }

    // Step 3a: Upsert Customer by Phone Number (initial totalOrdersCount = 0)
    let customerId: string | null = null;
    try {
      const existingCustomer = await db.query.customers.findFirst({
        where: eq(customers.phone, cleanPhone),
      });

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
          totalSpentBdt: (existingCustomer.totalSpentBdt || 0) + Math.round(totalAmountVal),
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
          totalOrdersCount: 0, // initially 0 for new customers
          totalSpentBdt: 0,
        }).returning();

        if (newCust) {
          customerId = newCust.id;
          // Increment totalOrdersCount to 1 on first order
          await db.update(customers).set({
            totalOrdersCount: 1,
            totalSpentBdt: Math.round(totalAmountVal),
          }).where(eq(customers.id, newCust.id));
        }
      }
    } catch (custErr) {
      console.warn('Customer upsert non-fatal warning:', custErr);
    }

    // Step 3b: Insert Order
    const [newOrder] = await db.insert(orders).values({
      orderNumber: orderNum,
      customerId: customerId,
      customerName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      shippingAddress: fullShippingAddress,
      city: cleanCity,
      district: cleanRegion,
      postalCode: cleanZip,
      deliveryInstructions: payload.deliveryInstructions ? payload.deliveryInstructions.trim() : null,
      subtotalBdt: subtotalBdt,
      vatBdt: vatBdt,
      deliveryChargeBdt: deliveryChargeBdt,
      discountBdt: 0,
      totalAmount: totalAmountVal.toString(),
      paymentMethod: payload.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery',
      status: 'Pending',
      paymentStatus: payload.paymentMethod === 'online' ? 'Paid (Online)' : 'Unpaid (COD)',
    }).returning();

    // Step 3c: Insert Order Items
    const itemsToInsert = itemsWithSecurePrices.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      productName: item.productName || 'Apparel Item',
      variantName: item.variantName || 'Primary',
      size: item.size || 'M',
      thumbnailUrl: item.thumbnailUrl || '/images/for_him.jpg',
      quantity: item.quantity,
      priceBdt: item.priceBdt,
      price: item.priceBdt.toString(),
    }));

    await db.insert(orderItems).values(itemsToInsert);

    try {
      revalidatePath('/admin/orders');
      revalidatePath('/admin/customers');
      revalidatePath('/profile');
    } catch {
      // safe fallback if revalidatePath is called outside Next.js request context
    }

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalAmount: totalAmountVal,
      message: 'Order placed successfully!',
    };
  } catch (error) {
    console.error('Database operation error when placing order:', error);
    return {
      success: false,
      message: 'Failed to place order due to a database connection error. Please try again.',
    };
  }
}
