'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { siteContent, storeSettings } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';

export type SiteContentKey = 'shipping_returns';

/** Default product-page shipping text, built from the current fees and free-delivery setting. */
async function defaultShippingText(): Promise<string> {
  let fee = 150;
  let freeOver = 0;
  try {
    const s = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 'general') });
    if (s) {
      fee = s.defaultDeliveryChargeBdt ?? fee;
      freeOver = s.freeShippingThresholdBdt ?? 0;
    }
  } catch {
    /* use defaults */
  }
  return [
    `**Nationwide delivery:** 2–3 working days inside Dhaka and 3–5 working days across the rest of Bangladesh. Delivery starts from ৳${fee} and the exact charge is shown at checkout.`,
    freeOver > 0 ? `**Free delivery:** on orders of ৳${freeOver.toLocaleString()} or more.` : '',
    '**Easy 7-day exchange:** size or fit not right? Exchange unworn items with the original tags within 7 days.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** Public: the text to show. Falls back to the default when nothing is saved (or the table isn't created yet). */
export async function getSiteContentAction(key: SiteContentKey): Promise<string> {
  try {
    const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
    if (row?.value?.trim()) return row.value;
  } catch {
    /* table missing: migration 0006 not run yet */
  }
  return key === 'shipping_returns' ? defaultShippingText() : '';
}

export async function getAdminSiteContentAction(key: SiteContentKey): Promise<{ value: string; saved: boolean; tableReady: boolean }> {
  await requireAdmin();
  try {
    const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
    if (row?.value?.trim()) return { value: row.value, saved: true, tableReady: true };
    return { value: await getSiteContentAction(key), saved: false, tableReady: true };
  } catch {
    return { value: await getSiteContentAction(key), saved: false, tableReady: false };
  }
}

const SaveSchema = z.object({
  key: z.enum(['shipping_returns']),
  value: z.string().max(4000, 'Text is too long (max 4000 characters).'),
});

/** Save the text. Saving an empty box goes back to the automatic default. */
export async function saveSiteContentAction(input: z.input<typeof SaveSchema>) {
  await requireAdmin();
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || 'Invalid input.' };
  const { key, value } = parsed.data;
  try {
    if (!value.trim()) {
      await db.delete(siteContent).where(eq(siteContent.key, key));
    } else {
      await db
        .insert(siteContent)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });
    }
    revalidatePath('/product/[slug]', 'page');
    return { success: true };
  } catch (err) {
    console.error('Failed to save site content:', err);
    return { success: false, message: 'Could not save. Run drizzle/manual/0006_promo_popup.sql on the database first.' };
  }
}
