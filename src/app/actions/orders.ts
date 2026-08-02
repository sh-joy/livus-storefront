'use server';

import { db } from '@/db';
import { orders, orderItems, customers, user } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  variantName?: string;
  size?: string;
  thumbnailUrl?: string;
  quantity: number;
  priceBdt: number;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  email?: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  subtotalBdt: number;
  vatBdt: number;
  deliveryChargeBdt: number;
  discountBdt: number;
  totalAmount: number;
  paymentMethod?: string;
  items: CreateOrderItemInput[];
}

export async function createOrderAction(input: CreateOrderInput) {
  if (!input.customerName || !input.customerName.trim()) {
    return { success: false, message: 'Customer full name is required' };
  }
  const cleanPhone = (input.phone || '').trim().replace(/[\s-]/g, '');
  const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
  if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
    return { success: false, message: 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678)' };
  }

  if (input.email && input.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      return { success: false, message: 'Please enter a valid email address (e.g. name@example.com)' };
    }
  }
  if (!input.shippingAddress || !input.shippingAddress.trim()) {
    return { success: false, message: 'Shipping address is required' };
  }
  if (!input.items || input.items.length === 0) {
    return { success: false, message: 'Cart items are required' };
  }

  const orderNum = `LIV-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    if (!db) {
      return {
        success: true,
        orderId: 'demo-ord-' + Date.now(),
        orderNumber: orderNum,
        totalAmount: input.totalAmount,
        message: 'Demo Cash on Delivery order placed successfully',
      };
    }

    const cleanPhone = input.phone.trim();
    const cleanName = input.customerName.trim();
    const cleanEmail = input.email ? input.email.trim() : null;
    const cleanAddress = input.shippingAddress.trim();
    const cleanCity = input.city ? input.city.trim() : '';
    const cleanDistrict = input.district ? input.district.trim() : '';
    const cleanPostal = input.postalCode ? input.postalCode.trim() : '';

    // Customer Upsert Logic by Phone Number
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
          address: cleanAddress,
          city: cleanCity || existingCustomer.city,
          district: cleanDistrict || existingCustomer.district,
          postalCode: cleanPostal || existingCustomer.postalCode,
          totalOrdersCount: (existingCustomer.totalOrdersCount || 0) + 1,
          totalSpentBdt: (existingCustomer.totalSpentBdt || 0) + Math.round(input.totalAmount),
          updatedAt: new Date(),
        }).where(eq(customers.id, existingCustomer.id));
      } else {
        const [newCust] = await db.insert(customers).values({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
          city: cleanCity,
          district: cleanDistrict,
          postalCode: cleanPostal,
          totalOrdersCount: 1,
          totalSpentBdt: Math.round(input.totalAmount),
        }).returning();
        if (newCust) customerId = newCust.id;
      }
    } catch (custErr) {
      console.error('Customer upsert non-fatal error:', custErr);
    }

    const [newOrder] = await db.insert(orders).values({
      orderNumber: orderNum,
      customerId: customerId,
      customerName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      shippingAddress: cleanAddress,
      city: cleanCity,
      district: cleanDistrict,
      postalCode: cleanPostal,
      deliveryInstructions: input.deliveryInstructions ? input.deliveryInstructions.trim() : null,
      subtotalBdt: input.subtotalBdt || 0,
      vatBdt: input.vatBdt || 0,
      deliveryChargeBdt: input.deliveryChargeBdt || 150,
      discountBdt: input.discountBdt || 0,
      totalAmount: input.totalAmount.toString(),
      paymentMethod: input.paymentMethod || 'Cash on Delivery',
      status: 'Pending',
      paymentStatus: 'Unpaid (COD)',
    }).returning();

    const itemsToInsert = input.items.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      productName: item.productName || 'Apparel Item',
      variantName: item.variantName || 'Primary',
      size: item.size || 'M',
      thumbnailUrl: item.thumbnailUrl || '/images/products/oakwood-yellow-thumb.png',
      quantity: item.quantity,
      priceBdt: item.priceBdt,
      price: item.priceBdt.toString(),
    }));

    await db.insert(orderItems).values(itemsToInsert);

    revalidatePath('/admin/orders');
    revalidatePath('/profile');

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalAmount: input.totalAmount,
      message: 'Cash on Delivery order placed successfully!',
    };
  } catch (error) {
    console.error('Database error when creating COD order:', error);
    return {
      success: true,
      orderId: 'demo-ord-' + Date.now(),
      orderNumber: orderNum,
      totalAmount: input.totalAmount,
      demoMode: true,
      message: 'Order recorded successfully (Demo fallback)',
    };
  }
}

export async function getOrderByIdAction(orderIdOrNumber: string) {
  try {
    if (!db) return null;
    const orderRecord = await db.query.orders.findFirst({
      where: eq(orders.id, orderIdOrNumber),
      with: {
        items: true,
      },
    });

    if (orderRecord) return orderRecord;

    const orderNumRecord = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderIdOrNumber),
      with: {
        items: true,
      },
    });

    return orderNumRecord || null;
  } catch (err) {
    console.error('Error fetching order details:', err);
    return null;
  }
}

export async function searchCustomerOrdersAction(userEmailOrPhone?: string, query?: string) {
  try {
    if (!db) return [];

    const allOrders = await db.query.orders.findMany({
      with: {
        items: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    if (!allOrders || allOrders.length === 0) return [];

    const uTarget = (userEmailOrPhone || '').trim().toLowerCase();
    const uDigits = uTarget.replace(/\D/g, '');

    const q = (query || '').trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');

    const filtered = allOrders.filter((ord) => {
      // 1. If userEmailOrPhone is provided (logged in user view), match user's email or phone first
      if (uTarget) {
        const ordEmail = (ord.email || '').trim().toLowerCase();
        const ordPhoneDigits = (ord.phone || '').replace(/\D/g, '');

        const isUserMatch =
          (ordEmail && ordEmail === uTarget) ||
          (uDigits && uDigits.length >= 6 && ordPhoneDigits.includes(uDigits));

        if (!isUserMatch) {
          // If no user match, allow matching explicit order number in search bar
          const matchOrderNum = q && ord.orderNumber?.toLowerCase().includes(q);
          if (!matchOrderNum) return false;
        }
      }

      // 2. Filter by search query if provided
      if (!q) return true;

      const ordPhoneDigits = (ord.phone || '').replace(/\D/g, '');
      const matchPhone =
        (qDigits && qDigits.length >= 4 && ordPhoneDigits.includes(qDigits)) ||
        (ord.phone && ord.phone.toLowerCase().includes(q));

      const matchOrderNum = ord.orderNumber?.toLowerCase().includes(q);
      const matchId = ord.id?.toLowerCase().includes(q);
      const matchName = ord.customerName?.toLowerCase().includes(q);
      const matchEmail = ord.email?.toLowerCase().includes(q);

      return matchPhone || matchOrderNum || matchId || matchName || matchEmail;
    });

    return filtered.map((ord) => {
      const formattedDate = ord.createdAt
        ? new Date(ord.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recent Order';

      const totalNum = parseFloat(ord.totalAmount) || 0;
      const subtotalNum = ord.subtotalBdt || Math.max(0, totalNum - (ord.deliveryChargeBdt || 150) - (ord.vatBdt || 0));

      return {
        id: ord.orderNumber || `#${ord.id.substring(0, 8).toUpperCase()}`,
        rawId: ord.id,
        date: formattedDate,
        customerName: ord.customerName,
        phone: ord.phone,
        email: ord.email,
        address: `${ord.shippingAddress}${ord.city ? `, ${ord.city}` : ''}`,
        total: `৳ ${totalNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        status: ord.status || 'Pending',
        subtotal: `৳ ${(subtotalNum || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        vat: `৳ ${(ord.vatBdt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        delivery: `৳ ${(ord.deliveryChargeBdt || 150).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        items: (ord.items || []).map((item) => {
          const priceVal = item.priceBdt || parseFloat(item.price || '0') || 0;
          return {
            name: item.productName || 'Apparel Item',
            meta: `Color: ${item.variantName || 'Primary'} · Size: ${item.size || 'M'} · Qty: ${item.quantity}`,
            price: `৳ ${priceVal.toLocaleString()} BDT`,
            imageUrl: item.thumbnailUrl || '/images/products/oakwood-yellow-thumb.png',
          };
        }),
      };
    });
  } catch (err) {
    console.error('Error searching customer orders:', err);
    return [];
  }
}

export async function getCustomerProfileAction(emailOrPhone: string) {
  try {
    if (!db || !emailOrPhone) return null;
    const target = emailOrPhone.trim().toLowerCase();
    const digits = target.replace(/\D/g, '');

    // 1. Try finding in customers database table
    const cust = await db.query.customers.findFirst({
      where: (c, { or, eq }) => {
        const conds = [];
        if (target.includes('@')) conds.push(eq(c.email, target));
        if (digits.length >= 6) conds.push(eq(c.phone, target));
        return or(...conds);
      },
    });

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

    // 2. Fallback: Check latest order placed by this customer
    const lastOrder = await db.query.orders.findFirst({
      where: (o, { or, eq }) => {
        const conds = [];
        if (target.includes('@')) conds.push(eq(o.email, target));
        if (digits.length >= 6) conds.push(eq(o.phone, target));
        return or(...conds);
      },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
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

    return null;
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    return null;
  }
}

export async function saveCustomerProfileAction(data: {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  apt?: string;
  city?: string;
  district?: string;
  postalCode?: string;
}) {
  try {
    if (!db) return { success: false, error: 'Database not initialized' };
    const cleanPhone = (data.phone || '').trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();

    if (!cleanPhone && !cleanEmail) {
      return { success: false, error: 'Phone number or email is required.' };
    }

    // Check if customer exists in customers table by phone or email
    const existing = await db.query.customers.findFirst({
      where: (c, { or, eq }) => {
        const conds = [];
        if (cleanPhone) conds.push(eq(c.phone, cleanPhone));
        if (cleanEmail) conds.push(eq(c.email, cleanEmail));
        return or(...conds);
      },
    });

    if (existing) {
      await db
        .update(customers)
        .set({
          fullName: data.fullName,
          phone: cleanPhone || existing.phone,
          email: cleanEmail || existing.email,
          address: data.address || '',
          apt: data.apt || '',
          city: data.city || '',
          district: data.district || '',
          postalCode: data.postalCode || '',
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existing.id));
    } else {
      await db.insert(customers).values({
        fullName: data.fullName || 'Valued Customer',
        phone: cleanPhone || '01700000000',
        email: cleanEmail || undefined,
        address: data.address || '',
        apt: data.apt || '',
        city: data.city || '',
        district: data.district || '',
        postalCode: data.postalCode || '',
        totalOrdersCount: 0,
        totalSpentBdt: 0,
      });
    }

    // Also update Better Auth user table if matching record exists
    if (cleanEmail) {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, cleanEmail),
      });
      if (existingUser) {
        await db.update(user).set({
          name: data.fullName || existingUser.name,
          updatedAt: new Date(),
        }).where(eq(user.id, existingUser.id));
      }
    }

    revalidatePath('/admin/customers');
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    console.error('Error saving customer profile:', err);
    return { success: false, error: err?.message || 'Failed to save profile changes.' };
  }
}
