import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import AllProductsClient from './AllProductsClient';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Shop All Athletic Streetwear & Jerseys | LIVUS Online" },
  description:
    "Browse the complete LIVUS catalog of athletic streetwear, premium jerseys, tees, and accessories. Convenient home delivery everywhere in Bangladesh.",
  alternates: { canonical: '/all-products' },
  openGraph: {
    title: "Shop All Athletic Streetwear & Jerseys | LIVUS Online",
    description:
      "Browse the complete LIVUS catalog of athletic streetwear, premium jerseys, tees, and accessories. Convenient home delivery everywhere in Bangladesh.",
    url: `${siteUrl}/all-products`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Shop All Streetwear | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop All Athletic Streetwear & Jerseys | LIVUS Online",
    description:
      "Browse the complete LIVUS catalog of athletic streetwear, premium jerseys, tees, and accessories. Convenient home delivery everywhere in Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function AllProductsPage() {
  const products = await getProducts();

  return (
    <NavigationWrapper>
      <AllProductsClient products={products} />
    </NavigationWrapper>
  );
}
