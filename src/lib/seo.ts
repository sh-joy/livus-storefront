import type { Metadata } from 'next';
import { getSiteProfile } from './site-profile';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export interface PageMetadataOptions {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
  type?: 'website' | 'article';
  keywords?: string[];
}

/**
 * Generate standard Next.js Metadata with canonical URL and robots directives.
 */
export async function pageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
  nofollow = false,
  type = 'website',
  keywords,
}: PageMetadataOptions): Promise<Metadata> {
  const profile = await getSiteProfile();
  const canonicalUrl = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const finalDesc = description || profile.seo.defaultDescription;
  const shareImg = image || profile.seo.shareImageUrl || `${siteUrl}/opengraph-image`;

  return {
    title,
    description: finalDesc,
    keywords: keywords || profile.seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noindex
      ? {
          index: false,
          follow: !nofollow,
          googleBot: {
            index: false,
            follow: !nofollow,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      title,
      description: finalDesc,
      url: canonicalUrl,
      siteName: profile.brand.name || 'LIVUS',
      locale: 'en_BD',
      type,
      images: [
        {
          url: shareImg,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: finalDesc,
      images: [shareImg],
      creator: profile.seo.twitterHandle || undefined,
      site: profile.seo.twitterHandle || undefined,
    },
  };
}

export function escapeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
