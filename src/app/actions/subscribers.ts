'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';

export interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
}

export async function addNewsletterSubscriberAction(email: string) {
  const rate = await checkRateLimit('subscribe', 5, 60000);
  if (!rate.success) {
    return { success: false, message: 'Too many subscription attempts. Please wait a minute and try again.' };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Invalid email address' };
  }

  try {
    if (db) {
      const existing = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, cleanEmail),
      });

      if (!existing) {
        await db.insert(newsletterSubscribers).values({
          email: cleanEmail,
        });
      }
    }
    revalidatePath('/admin/subscribers');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to add newsletter subscriber:', err);
    return { success: false, message: 'Could not subscribe right now. Please try again later.' };
  }
}

export async function fetchAdminSubscribersAction(): Promise<SubscriberItem[]> {
  await requireAdmin();
  if (!db) return [];
  try {
    const rows = await db.query.newsletterSubscribers.findMany({
      orderBy: [desc(newsletterSubscribers.subscribedAt)],
    });
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      subscribedAt: r.subscribedAt ? new Date(r.subscribedAt).toISOString().split('T')[0] : 'Recently',
      source: 'Storefront Footer',
    }));
  } catch (err) {
    console.error('Failed to fetch admin subscribers:', err);
    return [];
  }
}

export async function deleteAdminSubscriberAction(id: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
    }
    revalidatePath('/admin/subscribers');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete subscriber:', err);
    return { success: false, message: 'Failed to delete subscriber' };
  }
}
