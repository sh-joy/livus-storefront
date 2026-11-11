import type { Metadata } from 'next';
import { getPopularProductsAction } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import Homepage from '@/imports/Homepage';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'LIVUS — Premium Athletic Streetwear & Jerseys BD Shop' },
  description:
    'Shop LIVUS athletic streetwear, authentic jerseys and lifestyle apparel in Bangladesh. Fast nationwide delivery with Cash on Delivery, bKash and Nagad.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LIVUS — Premium Athletic Streetwear & Jerseys BD Shop',
    description:
      'Shop LIVUS athletic streetwear, authentic jerseys and lifestyle apparel in Bangladesh. Fast nationwide delivery with Cash on Delivery, bKash and Nagad.',
    url: siteUrl,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: 'LIVUS Athletic Streetwear' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIVUS — Premium Athletic Streetwear & Jerseys BD',
    description:
      'Shop LIVUS athletic streetwear, authentic jerseys and lifestyle apparel in Bangladesh. Fast nationwide delivery with Cash on Delivery, bKash and Nagad.',
    images: [`${siteUrl}/opengraph-image`],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LIVUS',
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
  // Social profile URLs (Facebook, Instagram, ...) to be added by the owner.
  sameAs: [] as string[],
};

export default async function Page() {
  const [popularProducts, collectionText] = await Promise.all([
    getPopularProductsAction(12),
    getSiteContentAction('home_collection_text'),
  ]);

  return (
    <NavigationWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c') }}
      />
      <Homepage products={popularProducts} collectionText={collectionText} />
    </NavigationWrapper>
  );
}
