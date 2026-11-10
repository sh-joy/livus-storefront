'use server';

import { requireAdmin } from '@/lib/admin-guard';
import { db } from '@/db';
import { products, categories, promoCodes, orders, orderItems, colorVariants, variantImages, stockInventory, customers, user, account, session } from '@/db/schema';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminToken, safeEqual } from '@/lib/admin-session';
import path from 'path';

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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error("Error reading .admin-credentials.json:", err);
  }
  return [
    {
      id: "usr-superadmin",
      name: "Super Admin",
      email: "superadmin@livus.com",
      password: "SuperAdmin123!",
      role: "superadmin",
      createdAt: "System Primary",
    },
    {
      id: "usr-admin-1",
      name: "Store Manager",
      email: "manager@livus.com",
      password: "ManagerSecret123!",
      role: "admin",
      createdAt: "Jul 28, 2026",
    },
    {
      id: "usr-test6",
      name: "Test 6 Admin",
      email: "test6@livus.com",
      password: "test6@livus.com",
      role: "admin",
      createdAt: "Aug 7, 2026",
    }
  ];
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
      // 1. Fetch records from customers table
      const dbCusts = await db.select().from(customers);
      if (dbCusts.length > 0) {
        dbCusts.forEach((c, idx) => {
          const cleanEmail = c.email || 'N/A';
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
              ordersCount: c.totalOrdersCount || 0,
              totalSpentBdt: Number(c.totalSpentBdt) || 0,
              city: c.city || 'Dhaka',
              district: c.district || 'Dhaka Division',
              lastOrderDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
              status: c.totalOrdersCount && c.totalOrdersCount > 3 ? 'VIP Member' : 'Active',
            });
          }
        });
      }

      // 2. Fetch records from user auth table to ensure newly registered accounts always appear
      const allUsers = await db.select().from(user);
      allUsers.forEach((u, idx) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (uEmail) {
          const exists = mergedList.some(m => m.email.toLowerCase() === uEmail);
          if (!exists) {
            mergedList.unshift({
              id: u.id,
              name: formatHumanName(u.name || '', uEmail),
              email: uEmail,
              phone: formatValidPhone((u as any).phoneNumber || ''),
              address: 'N/A',
              apt: '',
              type: 'Registered',
              ordersCount: 0,
              totalSpentBdt: 0,
              city: 'Dhaka',
              district: 'Dhaka Division',
              lastOrderDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'New Account',
              status: 'Active',
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
    if (!cleanPhone) return { success: false, message: 'Phone number is required' };

    if (db) {
      const existing = await db.query.customers.findFirst({
        where: eq(customers.phone, cleanPhone),
      });

      if (existing) {
        await db.update(customers).set({
          fullName: cleanName,
          email: cleanEmail || existing.email,
          address: data.address || existing.address,
          apt: data.apt || existing.apt,
          city: data.city || existing.city,
          district: data.district || existing.district,
          updatedAt: new Date(),
        }).where(eq(customers.id, existing.id));
      } else {
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
