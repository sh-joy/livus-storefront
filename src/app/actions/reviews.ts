'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { productReviews, products, orders, orderItems } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface ProductReviewItem {
  id: string;
  productId: string;
  productName?: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  headline?: string | null;
  comment: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  isVerifiedBuyer?: boolean;
}

export interface ProductReviewSummary {
  reviews: ProductReviewItem[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export async function fetchProductReviewsAction(productId: string): Promise<ProductReviewSummary> {
  const emptySummary: ProductReviewSummary = {
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  if (!db || !productId) return emptySummary;

  try {
    const rows = await db.query.productReviews.findMany({
      where: and(eq(productReviews.productId, productId), eq(productReviews.status, 'Approved')),
      orderBy: [desc(productReviews.createdAt)],
    });

    if (rows.length === 0) return emptySummary;

    // E7: Check delivered orders for this product to grant "Verified Buyer" only to real buyers
    const verifiedBuyerEmails = new Set<string>();
    try {
      const deliveredRows = await db
        .select({ email: orders.email })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orderItems.productId, productId),
            eq(orders.status, 'Delivered')
          )
        );
      for (const row of deliveredRows) {
        if (row.email) {
          verifiedBuyerEmails.add(row.email.trim().toLowerCase());
        }
      }
    } catch (err) {
      console.warn('Verified buyer lookup error:', err);
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    const mapped = rows.map((r) => {
      const ratingKey = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
      distribution[ratingKey] = (distribution[ratingKey] || 0) + 1;
      sum += r.rating;

      const isVerifiedBuyer = Boolean(
        r.customerEmail && verifiedBuyerEmails.has(r.customerEmail.trim().toLowerCase())
      );

      return {
        id: r.id,
        productId: r.productId,
        customerName: r.customerName,
        customerEmail: undefined, // C4: NEVER return reviewer emails to the public browser
        rating: r.rating,
        headline: r.headline,
        comment: r.comment,
        status: r.status as 'Pending' | 'Approved' | 'Rejected',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently',
        isVerifiedBuyer,
      };
    });

    const averageRating = Number((sum / rows.length).toFixed(1));

    return {
      reviews: mapped,
      averageRating,
      totalReviews: rows.length,
      ratingDistribution: distribution,
    };
  } catch (error) {
    console.error('Failed to fetch product reviews:', error);
    return emptySummary;
  }
}

export async function submitProductReviewAction(data: {
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  headline?: string;
  comment: string;
}) {
  const rate = await checkRateLimit('submit_review', 5, 60000);
  if (!rate.success) {
    return { success: false, message: 'Too many reviews submitted. Please wait a minute and try again.' };
  }

  const cleanName = (data.customerName || '').trim().slice(0, 60);
  const cleanEmail = (data.customerEmail || '').trim().toLowerCase().slice(0, 100);
  const cleanHeadline = (data.headline || '').trim().slice(0, 120);
  const cleanComment = (data.comment || '').trim().slice(0, 2000);
  const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));

  if (!cleanName || cleanName.length < 2) {
    return { success: false, message: 'Please enter your name.' };
  }
  if (!cleanComment || cleanComment.length < 5) {
    return { success: false, message: 'Review comment must be at least 5 characters.' };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, message: 'Please provide a star rating between 1 and 5.' };
  }

  try {
    if (!db) {
      return { success: false, message: 'Database is unavailable. Please try again later.' };
    }

    await db.insert(productReviews).values({
      productId: data.productId,
      customerName: cleanName,
      customerEmail: cleanEmail || null,
      rating,
      headline: cleanHeadline || null,
      comment: cleanComment,
      status: 'Pending', // Requires admin moderation as per user settings
    });

    try {
      revalidatePath('/admin/reviews');
      revalidatePath(`/product`);
    } catch {
      // outside http context
    }

    return {
      success: true,
      message: 'Thank you! Your review has been submitted and will appear on the product page following admin approval.',
    };
  } catch (err: any) {
    console.error('Failed to submit review:', err);
    return { success: false, message: 'Failed to submit review. Please try again.' };
  }
}

export async function fetchAdminReviewsAction(): Promise<ProductReviewItem[]> {
  await requireAdmin();
  if (!db) return [];

  try {
    const rows = await db.query.productReviews.findMany({
      orderBy: [desc(productReviews.createdAt)],
      with: {
        product: {
          columns: { name: true, slug: true },
        },
      },
    });

    return rows.map((r: any) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || 'Apparel Item',
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      rating: r.rating,
      headline: r.headline,
      comment: r.comment,
      status: r.status as 'Pending' | 'Approved' | 'Rejected',
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Recently',
    }));
  } catch (err) {
    console.error('Failed to fetch admin reviews:', err);
    return [];
  }
}

export async function updateAdminReviewStatusAction(reviewId: string, status: 'Approved' | 'Rejected') {
  await requireAdmin();
  try {
    if (db) {
      await db.update(productReviews).set({ status }).where(eq(productReviews.id, reviewId));
    }
    revalidatePath('/admin/reviews');
    revalidatePath('/product');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update review status:', err);
    return { success: false, message: 'Failed to update review status.' };
  }
}

export async function deleteAdminReviewAction(reviewId: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(productReviews).where(eq(productReviews.id, reviewId));
    }
    revalidatePath('/admin/reviews');
    revalidatePath('/product');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete review:', err);
    return { success: false, message: 'Failed to delete review.' };
  }
}
