import type { Metadata } from 'next';
import { getPopularProductsAction } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import Homepage from '@/imports/Homepage';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'LIVUS | Sportswear & Jerseys in Bangladesh' },
  description:
    'Shop sportswear in Bangladesh from LIVUS. Breathable jerseys, gym wear and activewear built to move. Fast nationwide delivery with Cash on Delivery. Shop now.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LIVUS | Sportswear & Jerseys in Bangladesh',
    description:
      'Shop sportswear in Bangladesh from LIVUS. Breathable jerseys, gym wear and activewear built to move. Fast nationwide delivery with Cash on Delivery. Shop now.',
    url: siteUrl,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: 'LIVUS Sportswear Bangladesh' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIVUS | Sportswear & Jerseys in Bangladesh',
    description:
      'Shop sportswear in Bangladesh from LIVUS. Breathable jerseys, gym wear and activewear built to move. Fast nationwide delivery with Cash on Delivery. Shop now.',
    images: [`${siteUrl}/opengraph-image`],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LIVUS',
  description: 'LIVUS is a Bangladeshi sportswear brand designing jerseys and activewear built to move in.',
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
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
