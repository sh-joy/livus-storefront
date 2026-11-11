'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { siteContent } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import {
  SITE_CONTENT_KEYS,
  type SiteContentKey,
  getDefaultSiteContent,
} from '@/lib/site-content';

/** Public: the text to show. Falls back to default when nothing is saved (or table not created yet). */
export async function getSiteContentAction(key: SiteContentKey): Promise<string> {
  try {
    if (db) {
      const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
      if (row?.value?.trim()) return row.value;
    }
  } catch {
    /* table missing: migration 0006/0007 not run yet */
  }

  return await getDefaultSiteContent(key);
}

/** Admin: get specific content block with saved status */
export async function getAdminSiteContentAction(
  key: SiteContentKey
): Promise<{ value: string; saved: boolean; tableReady: boolean }> {
  await requireAdmin();
  try {
    if (db) {
      const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
      if (row?.value?.trim()) return { value: row.value, saved: true, tableReady: true };
    }
    return { value: await getSiteContentAction(key), saved: false, tableReady: true };
  } catch {
    return { value: await getSiteContentAction(key), saved: false, tableReady: false };
  }
}

/** Admin: get all content blocks at once */
export async function getAllAdminSiteContentAction(): Promise<{
  contents: Record<SiteContentKey, { value: string; isCustom: boolean }>;
  tableReady: boolean;
}> {
  await requireAdmin();
  const res: Record<string, { value: string; isCustom: boolean }> = {};
  let tableReady = true;

  try {
    const rows = db ? await db.query.siteContent.findMany() : [];
    const map = new Map(rows.map((r) => [r.key, r.value]));

    for (const key of SITE_CONTENT_KEYS) {
      const custom = map.get(key);
      if (custom && custom.trim()) {
        res[key] = { value: custom, isCustom: true };
      } else {
        res[key] = { value: await getSiteContentAction(key), isCustom: false };
      }
    }
  } catch {
    tableReady = false;
    for (const key of SITE_CONTENT_KEYS) {
      res[key] = { value: await getSiteContentAction(key), isCustom: false };
    }
  }

  return { contents: res as Record<SiteContentKey, { value: string; isCustom: boolean }>, tableReady };
}

const SaveSchema = z.object({
  key: z.enum(SITE_CONTENT_KEYS),
  value: z.string().max(20000, 'Content is too long (max 20,000 characters).'),
});

/** Save a content block. Saving an empty box resets back to default. */
export async function saveSiteContentAction(input: z.input<typeof SaveSchema>) {
  await requireAdmin();
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || 'Invalid input.' };
  }

  const { key, value } = parsed.data;
  try {
    if (!db) return { success: false, message: 'Database offline.' };

    if (!value.trim()) {
      await db.delete(siteContent).where(eq(siteContent.key, key));
    } else {
      await db
        .insert(siteContent)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });
    }

    // Revalidate affected routes
    switch (key) {
      case 'about_page':
        revalidatePath('/about');
        break;
      case 'privacy_page':
        revalidatePath('/privacy');
        break;
      case 'terms_page':
        revalidatePath('/terms');
        break;
      case 'shipping_page':
        revalidatePath('/shipping-returns');
        break;
      case 'cookies_page':
        revalidatePath('/cookies');
        break;
      case 'contact_intro':
      case 'contact_faqs':
        revalidatePath('/contact');
        break;
      case 'home_collection_text':
        revalidatePath('/');
        break;
      case 'newsletter_cta':
        revalidatePath('/', 'layout');
        break;
      case 'shipping_returns':
        revalidatePath('/product/[slug]', 'page');
        break;
    }

    return { success: true };
  } catch (err) {
    console.error(`Failed to save site content for key ${key}:`, err);
    return {
      success: false,
      message: 'Could not save. Run drizzle/manual/0007_site_profile.sql on the database first.',
    };
  }
}
