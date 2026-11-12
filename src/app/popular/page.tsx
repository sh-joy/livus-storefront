import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Best-Selling Sportswear | Popular Jerseys & Tops | LIVUS" },
  description:
    "Shop best-selling sportswear at LIVUS. Explore popular jerseys and training gear chosen by players across Bangladesh. Fast delivery with Cash on Delivery.",
  alternates: { canonical: '/popular' },
  openGraph: {
    title: "Best-Selling Sportswear | Popular Jerseys & Tops | LIVUS",
    description:
      "Shop best-selling sportswear at LIVUS. Explore popular jerseys and training gear chosen by players across Bangladesh. Fast delivery with Cash on Delivery.",
    url: `${siteUrl}/popular`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Best-Selling Sportswear | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Best-Selling Sportswear | Popular Jerseys & Tops | LIVUS",
    description:
      "Shop best-selling sportswear at LIVUS. Explore popular jerseys and training gear chosen by players across Bangladesh. Fast delivery with Cash on Delivery.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function PopularPage() {
  const products = await getProducts('popular');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Popular."
        subtitle="Most-loved match jerseys and performance activewear chosen by players across Bangladesh."
      />
    </NavigationWrapper>
  );
}
