import type { MetadataRoute } from 'next';
import { getSiteProfile } from '@/lib/site-profile';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getSiteProfile();

  const brandName = profile.brand.name || 'LIVUS';
  const tagline = profile.brand.tagline || 'Athletic Streetwear & Jerseys';
  const favicon = profile.brand.faviconUrl || '/favicon.ico';

  return {
    name: `${brandName} — ${tagline}`,
    short_name: brandName,
    description: profile.seo.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0d',
    theme_color: '#ffffff',
    icons: [
      {
        src: favicon,
        sizes: 'any',
        type: favicon.endsWith('.png') ? 'image/png' : 'image/x-icon',
      },
    ],
  };
}
