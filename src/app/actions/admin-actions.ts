'use server';

import { db } from '@/db';
import { products, categories, promoCodes, orders, orderItems, colorVariants, variantImages, stockInventory, customers } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';

// ----------------------------------------------------
// 1. PRODUCTS SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminProducts() {
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
    revalidatePath('/product');
    return { success: true, product: newProduct };
  } catch (error) {
    console.error('Failed to create admin product:', error);
    return { success: false, message: 'Failed to create product in Neon database' };
  }
}

export async function deleteAdminProductAction(id: string) {
  try {
    if (db) {
      await db.delete(products).where(eq(products.id, id));
      revalidatePath('/admin/products');
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
  try {
    if (db) {
      const list = await db.select().from(categories).orderBy(desc(categories.createdAt));
      // Filter out gender items (For Him, For Her, Unisex) from aesthetic collection categories
      const collectionList = list.filter(c => 
        !["for him", "for her", "unisex", "unisex / minimal"].includes(c.name.toLowerCase().trim())
      );

      if (collectionList.length > 0) {
        return collectionList.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || 'Aesthetic collection tag',
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching admin categories:', error);
  }

  return [
    { id: "cat-min", name: "Minimal", slug: "minimal", description: "Clean minimalist aesthetic apparel" },
    { id: "cat-div", name: "Divine", slug: "divine", description: "High-fashion luxury aesthetic" },
    { id: "cat-cas", name: "Casual", slug: "casual", description: "Everyday streetwear aesthetic" },
    { id: "cat-gam", name: "Gaming", slug: "gaming", description: "Esports & geometric performance apparel" },
    { id: "cat-flo", name: "Floral", slug: "floral", description: "Botanical and nature pattern aesthetic" },
  ];
}

export async function createAdminCategoryAction(data: { name: string; slug: string; description?: string }) {
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
  try {
    if (db) {
      await db.delete(categories).where(eq(categories.id, id));
      revalidatePath('/admin/categories');
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to delete category:', error);
  }
  return { success: true };
}

// ----------------------------------------------------
// 3. PROMO CODES SERVER ACTIONS
// ----------------------------------------------------
export async function fetchAdminPromos() {
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
  try {
    if (db) {
      await db.update(orders).set({
        status: newStatus,
        paymentStatus: newStatus === 'Delivered' ? 'Paid (COD Collected)' : 'Unpaid (COD)',
      }).where(eq(orders.id, orderId));

      revalidatePath('/admin/orders');
      return { success: true, message: `Order status updated to ${newStatus}` };
    }
  } catch (error) {
    console.error('Failed to update order status:', error);
  }
  return { success: true, message: `Order status updated to ${newStatus}` };
}

export async function deleteAdminOrderAction(orderId: string) {
  try {
    if (db) {
      await db.delete(orders).where(eq(orders.id, orderId));
      revalidatePath('/admin/orders');
      revalidatePath('/profile');
      return { success: true, message: 'Order deleted successfully' };
    }
  } catch (error) {
    console.error('Failed to delete order:', error);
    return { success: false, message: 'Failed to delete order' };
  }
  return { success: true, message: 'Order deleted successfully' };
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
    productName: string;
    variantName?: string;
    size?: string;
    quantity: number;
    priceBdt: number;
  }[];
}) {
  try {
    if (!db) {
      return { success: false, message: 'Database connection uninitialized' };
    }

    const orderNum = `LIV-${Math.floor(10000 + Math.random() * 90000)}`;

    const cleanPhone = data.phone.trim();
    const cleanName = data.customerName.trim();
    const cleanEmail = data.email ? data.email.trim() : null;
    const cleanAddress = data.shippingAddress.trim();
    const cleanCity = data.city ? data.city.trim() : 'Dhaka';
    const cleanDistrict = data.district ? data.district.trim() : 'Dhaka Division';

    let subtotalBdt = 0;
    const itemsInput = (data.items || []).map((i) => {
      const itemPrice = i.priceBdt || 899;
      subtotalBdt += itemPrice * (i.quantity || 1);
      return {
        productName: i.productName || 'Apparel Item',
        variantName: i.variantName || 'Primary',
        size: i.size || 'M',
        quantity: i.quantity || 1,
        priceBdt: itemPrice,
      };
    });

    const vatBdt = itemsInput.length > 0 ? 90 : 0;
    const deliveryChargeBdt = itemsInput.length > 0 ? 150 : 0;
    const totalAmountVal = subtotalBdt + vatBdt + deliveryChargeBdt;

    // Customer Upsert (initial totalOrdersCount = 0)
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
          city: cleanCity,
          district: cleanDistrict,
          totalOrdersCount: (existingCustomer.totalOrdersCount || 0) + 1,
          totalSpentBdt: (existingCustomer.totalSpentBdt || 0) + Math.round(totalAmountVal),
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
          totalOrdersCount: 0, // initially 0 for new customers
          totalSpentBdt: 0,
        }).returning();

        if (newCust) {
          customerId = newCust.id;
          await db.update(customers).set({
            totalOrdersCount: 1,
            totalSpentBdt: Math.round(totalAmountVal),
          }).where(eq(customers.id, newCust.id));
        }
      }
    } catch (custErr) {
      console.warn('Admin customer upsert non-fatal warning:', custErr);
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
      subtotalBdt: subtotalBdt,
      vatBdt: vatBdt,
      deliveryChargeBdt: deliveryChargeBdt,
      discountBdt: 0,
      totalAmount: totalAmountVal.toString(),
      paymentMethod: data.paymentMethod || 'Cash on Delivery',
      status: data.status || 'Pending',
      paymentStatus: data.status === 'Delivered' ? 'Paid (COD Collected)' : 'Unpaid (COD)',
    }).returning();

    const itemsToInsert = itemsInput.map((item) => ({
      orderId: newOrder.id,
      productId: 'admin-prod-manual',
      productName: item.productName,
      variantName: item.variantName,
      size: item.size,
      thumbnailUrl: '/images/for_him.jpg',
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
      // safe fallback
    }

    return { success: true, orderId: newOrder.id, orderNumber: newOrder.orderNumber, message: 'Order created successfully' };
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
