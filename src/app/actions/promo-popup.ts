'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { promoPopup } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';

export type PromoPopupConfig = {
  isEnabled: boolean;
  imageUrl: string;
  headline: string;
  body: string;
  buttonLabel: string;
  finePrint: string;
  delaySeconds: number;
  showAgainDays: number;
  /** Changes whenever the admin saves, so visitors who closed an old offer see a new one. */
  version: string;
};

const DEFAULTS: Omit<PromoPopupConfig, 'version'> = {
  isEnabled: false,
  imageUrl: '',
  headline: 'Unlock early access to every drop',
  body: 'Sign up to be the first to hear about new LIVUS arrivals, restocks and members-only offers.',
  buttonLabel: 'Join our newsletter',
  finePrint: 'By providing your email address, you agree to our Terms & Privacy Policy.',
  delaySeconds: 5,
  showAgainDays: 3,
};

function toConfig(row: typeof promoPopup.$inferSelect | undefined | null): PromoPopupConfig {
  if (!row) return { ...DEFAULTS, version: '0' };
  return {
    isEnabled: row.isEnabled,
    imageUrl: row.imageUrl,
    headline: row.headline,
    body: row.body,
    buttonLabel: row.buttonLabel || DEFAULTS.buttonLabel,
    finePrint: row.finePrint,
    delaySeconds: row.delaySeconds,
    showAgainDays: row.showAgainDays,
    version: String(new Date(row.updatedAt).getTime()),
  };
}

/**
 * Public: the popup to show, or null when it is off (or the table has not been created yet).
 * `preview` (from ?popup-preview=1) returns the saved content even while switched off, so the owner can check it.
 */
export async function getPromoPopupAction(preview = false): Promise<PromoPopupConfig | null> {
  try {
    const row = await db.query.promoPopup.findFirst({ where: eq(promoPopup.id, 'main') });
    const cfg = toConfig(row);
    if (preview) return { ...cfg, headline: cfg.headline || DEFAULTS.headline, version: 'preview' };
    return cfg.isEnabled && cfg.headline ? cfg : null;
  } catch {
    // Table missing (migration 0006 not run yet) or DB unreachable: don't show a popup (preview shows the defaults).
    return preview ? { ...DEFAULTS, imageUrl: '/images/for_him.jpg', version: 'preview' } : null;
  }
}

export async function getAdminPromoPopupAction(): Promise<{ config: PromoPopupConfig; tableReady: boolean }> {
  await requireAdmin();
  try {
    const row = await db.query.promoPopup.findFirst({ where: eq(promoPopup.id, 'main') });
    return { config: toConfig(row), tableReady: true };
  } catch {
    return { config: toConfig(null), tableReady: false };
  }
}

const imageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//i.test(v), 'Image must be an uploaded photo or an https:// link.');

const SaveSchema = z.object({
  isEnabled: z.boolean(),
  imageUrl: imageUrlSchema,
  headline: z.string().trim().min(1, 'Headline is required.').max(140),
  body: z.string().trim().max(400),
  buttonLabel: z.string().trim().min(1, 'Button text is required.').max(40),
  finePrint: z.string().trim().max(200),
  delaySeconds: z.coerce.number().int().min(0).max(120),
  showAgainDays: z.coerce.number().int().min(0).max(365),
});

export async function saveAdminPromoPopupAction(input: z.input<typeof SaveSchema>) {
  await requireAdmin();
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || 'Invalid input.' };
  const data = { ...parsed.data, updatedAt: new Date() };
  try {
    await db
      .insert(promoPopup)
      .values({ id: 'main', ...data })
      .onConflictDoUpdate({ target: promoPopup.id, set: data });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) {
    console.error('Failed to save promo popup:', err);
    return {
      success: false,
      message: 'Could not save. If this is the first time, run drizzle/manual/0006_promo_popup.sql on the database first.',
    };
  }
}
