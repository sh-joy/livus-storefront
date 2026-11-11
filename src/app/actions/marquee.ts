'use server';

import { db } from '@/db';
import { marqueeAnnouncements } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface MarqueeItem {
  id: string;
  message: string;
  linkUrl: string | null;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  createdAt?: Date;
}

const DEFAULT_MARQUEES = [
  "FREE SHIPPING ON ORDERS OVER ৳2,500 · NATIONWIDE CASH ON DELIVERY",
  "NEW DROP LIVE NOW · CASH ON DELIVERY & BKASH AVAILABLE",
];

export async function getActiveMarqueeAnnouncementsAction(): Promise<string[]> {
  try {
    if (!db) return DEFAULT_MARQUEES;
    const rows = await db.query.marqueeAnnouncements.findMany({
      where: eq(marqueeAnnouncements.isActive, true),
      orderBy: [desc(marqueeAnnouncements.createdAt)],
    });
    if (rows.length > 0) {
      return rows.map((r) => r.message);
    }
  } catch (error) {
    console.error('Failed to load active marquee announcements:', error);
  }
  return DEFAULT_MARQUEES;
}

export async function fetchAdminMarqueesAction(): Promise<MarqueeItem[]> {
  await requireAdmin();
  if (!db) return [];
  try {
    const rows = await db.query.marqueeAnnouncements.findMany({
      orderBy: [desc(marqueeAnnouncements.createdAt)],
    });
    return rows.map((r) => ({
      id: r.id,
      message: r.message,
      linkUrl: r.linkUrl,
      bgColor: r.bgColor,
      textColor: r.textColor,
      isActive: r.isActive,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('Failed to fetch admin marquees:', err);
    return [];
  }
}

export async function createAdminMarqueeAction(data: {
  message: string;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
  isActive?: boolean;
}) {
  await requireAdmin();
  const cleanMessage = (data.message || '').trim();
  if (!cleanMessage) {
    return { success: false, message: 'Announcement message cannot be empty' };
  }

  try {
    if (db) {
      await db.insert(marqueeAnnouncements).values({
        message: cleanMessage,
        linkUrl: data.linkUrl ? data.linkUrl.trim() : null,
        bgColor: data.bgColor || '#050505',
        textColor: data.textColor || '#ffffff',
        isActive: data.isActive !== false,
      });
    }
    revalidatePath('/', 'layout');
    revalidatePath('/admin/marquee');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to create marquee:', err);
    return { success: false, message: err?.message || 'Failed to create marquee announcement.' };
  }
}

export async function toggleAdminMarqueeAction(id: string, isActive: boolean) {
  await requireAdmin();
  try {
    if (db) {
      await db.update(marqueeAnnouncements).set({ isActive }).where(eq(marqueeAnnouncements.id, id));
    }
    revalidatePath('/', 'layout');
    revalidatePath('/admin/marquee');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to toggle marquee status:', err);
    return { success: false, message: 'Failed to update announcement.' };
  }
}

export async function deleteAdminMarqueeAction(id: string) {
  await requireAdmin();
  try {
    if (db) {
      await db.delete(marqueeAnnouncements).where(eq(marqueeAnnouncements.id, id));
    }
    revalidatePath('/', 'layout');
    revalidatePath('/admin/marquee');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete marquee:', err);
    return { success: false, message: 'Failed to delete announcement.' };
  }
}
