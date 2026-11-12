import { z } from 'zod';
import { isValidBdMobile, isValidTrxId } from '@/lib/bangladesh-geo';

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
  division: z.string().optional(),
  district: z.string().optional(),
  stateRegion: z.string().min(2, 'Please choose your division'),
  city: z.string().min(2, 'Please choose your district'),
  zipCode: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.enum(['online', 'cash', 'bkash', 'nagad']),
  trxId: z.string().optional(),
  senderPhone: z.string().optional(),
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
}).superRefine((data, ctx) => {
  if (data.paymentMethod === 'bkash' || data.paymentMethod === 'nagad') {
    const walletName = data.paymentMethod === 'bkash' ? 'bKash' : 'Nagad';
    const cleanTrx = (data.trxId || '').trim();
    if (!cleanTrx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trxId'],
        message: `Please enter your ${walletName} Transaction ID (TrxID)`,
      });
    } else if (!isValidTrxId(cleanTrx)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['trxId'],
        message: 'Transaction ID must be 8-16 alphanumeric characters.',
      });
    }

    const cleanSender = (data.senderPhone || '').trim();
    if (!cleanSender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['senderPhone'],
        message: `Please enter your ${walletName} mobile number`,
      });
    } else if (!isValidBdMobile(cleanSender)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['senderPhone'],
        message: 'Please enter a valid 11-digit Bangladeshi mobile number.',
      });
    }
  }
});

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

const moneyString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,7}$/.test(v), 'Enter a whole number of taka (e.g. 1450).');

export const CreateProductSchema = z
  .object({
    title: z.string().trim().min(2, 'Product name must be at least 2 characters.').max(150),
    slug: z
      .string()
      .transform((v) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
      .pipe(z.string().min(2, 'URL slug must be at least 2 characters.'))
      .refine((v) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'URL slug can only use lowercase letters, numbers and single dashes.')
      .refine((v) => v.length <= 120, 'URL slug is too long.'),
    basePrice: moneyString.refine((v) => Number(v) > 0, 'Price must be more than 0.'),
    compareAtPrice: moneyString.optional().or(z.literal('')).nullable(),
    collectionTag: z.string().trim().max(60).optional().nullable(),
    categoryId: z.string().trim().optional().nullable(),
    specifications: z.string().max(20000).optional().nullable(),
    isActive: z.boolean().default(true),
    colorVariants: z
      .array(
        z.object({
          colorName: z.string().trim().min(1, 'Every colour needs a name.').max(60),
          hexCode: z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, 'Colour code must look like #000000.').default('#000000'),
          thumbnailUrl: z.string().trim().max(2000).optional().nullable(),
          isLowStock: z.boolean().default(false),
          images: z.array(z.string().trim().min(1).max(2000)).max(20).default([]),
          inventory: z
            .array(
              z.object({
                size: z.string().trim().min(1).max(30),
                sku: z.string().trim().max(60).optional().nullable(),
                quantity: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? 0 : Number(v)), z.number().int('Stock must be a whole number.').min(0, 'Stock cannot be negative.').max(100000)),
                isStockOut: z.boolean().optional(),
              })
            )
            .max(30),
        })
      )
      .min(1, 'Add at least one colour.')
      .max(20),
  })
  // A "compare at" price that isn't higher than the selling price isn't a discount: drop it.
  .transform((d) => ({
    ...d,
    compareAtPrice: d.compareAtPrice && Number(d.compareAtPrice) > Number(d.basePrice) ? d.compareAtPrice : null,
  }));

export type CreateProductValues = z.input<typeof CreateProductSchema>;

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
