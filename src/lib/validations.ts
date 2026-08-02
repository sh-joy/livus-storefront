import { z } from 'zod';

export const CheckoutFormSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .refine(
      (val) => /^[a-zA-Z\s'. -]{3,}$/.test(val.trim()),
      'Please enter a valid name (letters only, e.g. Alex Johnson)'
    ),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .refine((val) => {
      const clean = val.trim().replace(/[\s-]/g, '');
      return /^(?:\+?88)?01[3-9]\d{8}$/.test(clean);
    }, 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678)'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  streetAddress: z.string().optional(),
  aptSuite: z.string().optional(),
  stateRegion: z.string().min(2, 'State / Region (District) is required'),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.enum(['online', 'cash']),
  cartItems: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string().optional(),
        variantName: z.string().optional(),
        size: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        priceBdt: z.number().optional(),
      })
    )
    .min(1, 'Your cart is empty. Please add items before checking out.'),
});

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

export const CreateProductSchema = z.object({
  title: z.any().optional(),
  name: z.any().optional(),
  slug: z.any().optional(),
  description: z.any().optional(),
  basePrice: z.any().optional(),
  priceBdt: z.any().optional(),
  compareAtPrice: z.any().optional(),
  compareAtPriceBdt: z.any().optional(),
  collectionTag: z.any().optional(),
  category: z.any().optional(),
  categoryId: z.any().optional(),
  specifications: z.any().optional(),
  isActive: z.any().optional(),
  variants: z.any().optional(),
  colorVariants: z.any().optional(),
});

export type CreateProductValues = z.infer<typeof CreateProductSchema>;

export const marqueeFormSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  linkUrl: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const promoCodeFormSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1, 'Discount value must be at least 1'),
  minCartValue: z.number().optional(),
  usageLimit: z.number().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});
