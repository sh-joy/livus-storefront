'use server';

import { db } from '@/db';
import { categories } from '@/db/schema';
import { CategorySchema } from '@/lib/validations/schema';
import { revalidatePath } from 'next/cache';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Date;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Electronics & Audio', slug: 'electronics', description: 'Headphones, gadgets, & accessories' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Apparel & Wearables', slug: 'apparel', description: 'Premium minimalist clothing' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Home & Office', slug: 'home-office', description: 'Ergonomic workspace decor & tools' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Accessories', slug: 'accessories', description: 'Everyday carrying essentials' },
];

export async function getCategories() {
  try {
    if (db) {
      const result = await db.select().from(categories);
      if (result.length > 0) {
        return result;
      }
    }
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.warn('Database connection warning (using default categories fallback):', error);
    return DEFAULT_CATEGORIES;
  }
}

export async function createCategoryAction(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
  };

  const validation = CategorySchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  try {
    if (!db) {
      return { success: false, message: 'Database connection not configured in .env.local' };
    }
    const [newCategory] = await db.insert(categories).values(validation.data).returning();
    revalidatePath('/');
    return { success: true, category: newCategory };
  } catch (error) {
    console.error('Failed to create category:', error);
    return { success: false, message: 'Database query failed or slug already exists.' };
  }
}
