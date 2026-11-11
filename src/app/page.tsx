import type { Metadata } from 'next';
import { getPopularProductsAction } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import Homepage from '@/imports/Homepage';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: 'LIVUS — Athletic Streetwear & Jerseys | Bangladesh' },
  description:
    'Shop LIVUS athletic streetwear, jerseys and accessories for him and her. Nationwide delivery across Bangladesh with Cash on Delivery, bKash and Nagad.',
  alternates: { canonical: '/' },
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
