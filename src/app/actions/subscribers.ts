'use server';

import { db } from '@/db';
import { newsletterSubscribers } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function addNewsletterSubscriberAction(email: string) {
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
