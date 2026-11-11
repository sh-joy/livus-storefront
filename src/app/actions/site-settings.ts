'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { siteContent } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-guard';
import {
  SiteProfileSchema,
  type SiteProfile,
  getSiteProfile,
  DEFAULT_SITE_PROFILE,
  mergeSiteProfile,
} from '@/lib/site-profile';

/**
 * Admin: Get the site profile with DB readiness status.
 */
export async function getAdminSiteProfileAction(): Promise<{
  profile: SiteProfile;
  tableReady: boolean;
}> {
  await requireAdmin();
  let tableReady = true;

  try {
    if (db) {
      await db.query.siteContent.findFirst({
        where: eq(siteContent.key, 'site_profile'),
      });
    }
  } catch {
    tableReady = false;
  }

  const profile = await getSiteProfile();
  return { profile, tableReady };
}

/**
 * Superadmin: Save the site profile.
 * Validates URLs (https://), BD phones (^(?:\+?88)?01[3-9]\d{8}$), trims strings.
 */
export async function saveSiteProfileAction(input: unknown): Promise<{
  success: boolean;
  message?: string;
}> {
  await requireAdmin({ superadmin: true });

  const parsed = SiteProfileSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid site profile settings.';
    return { success: false, message: errorMsg };
  }

  const profileData = parsed.data;

  try {
    if (!db) {
      return { success: false, message: 'Database client unavailable.' };
    }

    await db
      .insert(siteContent)
      .values({
        key: 'site_profile',
        value: JSON.stringify(profileData),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: {
          value: JSON.stringify(profileData),
          updatedAt: new Date(),
        },
      });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save site profile:', err);
    return {
      success: false,
      message: 'Could not save site settings. Please ensure migration 0007_site_profile.sql has been applied.',
    };
  }
}

/**
 * Public: Get public site profile fields for client components.
 */
export async function getPublicSiteProfileAction(): Promise<SiteProfile> {
  try {
    return await getSiteProfile();
  } catch {
    return DEFAULT_SITE_PROFILE;
  }
}
