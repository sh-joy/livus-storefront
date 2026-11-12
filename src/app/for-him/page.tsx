import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Men's Sportswear Bangladesh | Jerseys & Gym Wear | LIVUS" },
  description:
    "Shop men's sportswear in Bangladesh at LIVUS. Breathable men's jerseys, gym t-shirts and training wear. Nationwide delivery with Cash on Delivery. Shop now.",
  alternates: { canonical: '/for-him' },
  openGraph: {
    title: "Men's Sportswear Bangladesh | Jerseys & Gym Wear | LIVUS",
    description:
      "Shop men's sportswear in Bangladesh at LIVUS. Breathable men's jerseys, gym t-shirts and training wear. Nationwide delivery with Cash on Delivery. Shop now.",
    url: `${siteUrl}/for-him`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Men's Sportswear Bangladesh | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Men's Sportswear Bangladesh | Jerseys & Gym Wear | LIVUS",
    description:
      "Shop men's sportswear in Bangladesh at LIVUS. Breathable men's jerseys, gym t-shirts and training wear. Nationwide delivery with Cash on Delivery. Shop now.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function ForHimPage() {
  const [products, introText] = await Promise.all([
    getProducts('for-him'),
    getSiteContentAction('category_for_him_intro'),
  ]);

  return (
    <NavigationWrapper>
      <ForHim products={products} subtitle={introText} />
    </NavigationWrapper>
  );
}
