import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});

export const ProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format (e.g., 29.99)'),
  stock: z.coerce.number().int().min(0, 'Stock must be a non-negative integer'),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
});

export const CreateOrderSchema = z.object({
  userId: z.string().uuid().optional(),
  shippingAddress: z.string().min(5, 'Shipping address must be at least 5 characters'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  })).min(1, 'Order must contain at least one item'),
});

export const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['customer', 'admin']).default('customer'),
});
