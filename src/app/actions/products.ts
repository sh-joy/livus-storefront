'use server';

import { db } from '@/db';
import { products } from '@/db/schema';
import { ProductSchema } from '@/lib/validations/schema';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  categoryId: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'p1111111-1111-1111-1111-111111111111',
    name: 'Acoustic Clarity Wireless Headphones',
    slug: 'acoustic-clarity-headphones',
    description: 'Active noise cancelling headphones with 40-hour battery life and spatial audio driver.',
    price: '249.99',
    stock: 25,
    categoryId: '11111111-1111-1111-1111-111111111111',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
  },
  {
    id: 'p2222222-2222-2222-2222-222222222222',
    name: 'Ergonomic Minimalist Mechanical Keyboard',
    slug: 'ergonomic-mechanical-keyboard',
    description: 'Custom hot-swappable switches, anodized aluminum chassis, and RGB per-key backlighting.',
    price: '179.50',
    stock: 14,
    categoryId: '11111111-1111-1111-1111-111111111111',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
  },
  {
    id: 'p3333333-3333-3333-3333-333333333333',
    name: 'Ultra-Light Leather Laptop Backpack',
    slug: 'leather-laptop-backpack',
    description: 'Handcrafted full-grain leather backpack with dedicated 16-inch padded laptop compartment.',
    price: '189.00',
    stock: 8,
    categoryId: '44444444-4444-4444-4444-444444444444',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
  },
  {
    id: 'p4444444-4444-4444-4444-444444444444',
    name: 'Precision Smart Watch Chronograph',
    slug: 'precision-smart-watch',
    description: 'Titanium bezel, OLED display, continuous heart rate tracking, and 7-day battery life.',
    price: '299.00',
    stock: 19,
    categoryId: '11111111-1111-1111-1111-111111111111',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
  },
  {
    id: 'p5555555-5555-5555-5555-555555555555',
    name: 'Matte Ceramic Coffee Mug & Warmer Set',
    slug: 'ceramic-coffee-warmer-set',
    description: 'Temperature-controlled smart mug with inductive warming coaster.',
    price: '64.99',
    stock: 42,
    categoryId: '33333333-3333-3333-3333-333333333333',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
  },
  {
    id: 'p6666666-6666-6666-6666-666666666666',
    name: 'Organic Heavyweight Crewneck Sweatshirt',
    slug: 'heavyweight-crewneck-sweatshirt',
    description: '100% organic combed cotton, relaxed fit, brushed interior for extreme comfort.',
    price: '85.00',
    stock: 30,
    categoryId: '22222222-2222-2222-2222-222222222222',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
  }
];

export async function getProducts(categoryId?: string) {
  try {
    let query = db.select().from(products).orderBy(desc(products.createdAt));
    const result = await query;
    if (result.length === 0) {
      return categoryId 
        ? DEFAULT_PRODUCTS.filter(p => p.categoryId === categoryId)
        : DEFAULT_PRODUCTS;
    }
    return categoryId 
      ? result.filter(p => p.categoryId === categoryId)
      : result;
  } catch (error) {
    console.warn('Database query fallback (using default sample products):', error);
    return categoryId 
      ? DEFAULT_PRODUCTS.filter(p => p.categoryId === categoryId)
      : DEFAULT_PRODUCTS;
  }
}

export async function createProductAction(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    description: formData.get('description') as string,
    price: formData.get('price') as string,
    stock: Number(formData.get('stock')),
    categoryId: (formData.get('categoryId') as string) || undefined,
    imageUrl: (formData.get('imageUrl') as string) || '',
    isFeatured: formData.get('isFeatured') === 'on' || formData.get('isFeatured') === 'true',
  };

  const validation = ProductSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    const [newProduct] = await db.insert(products).values(validation.data).returning();
    revalidatePath('/');
    return { success: true, product: newProduct };
  } catch (error) {
    console.error('Failed to create product:', error);
    return { success: false, message: 'Database insert failed. Check unique slug constraints.' };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { success: false, message: 'Failed to delete product.' };
  }
}
