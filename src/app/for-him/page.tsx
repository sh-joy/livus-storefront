import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Men's Athletic Streetwear, Tees & Jerseys | LIVUS BD" },
  description:
    "Explore LIVUS men's collection of athletic streetwear, training jerseys, relaxed tees, and activewear crafted for comfort and style across Bangladesh.",
  alternates: { canonical: '/for-him' },
  openGraph: {
    title: "Men's Athletic Streetwear, Tees & Jerseys | LIVUS BD",
    description:
      "Explore LIVUS men's collection of athletic streetwear, training jerseys, relaxed tees, and activewear crafted for comfort and style across Bangladesh.",
    url: `${siteUrl}/for-him`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Men's Athletic Streetwear | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Men's Athletic Streetwear, Tees & Jerseys | LIVUS BD",
    description:
      "Explore LIVUS men's collection of athletic streetwear, training jerseys, relaxed tees, and activewear crafted for comfort and style across Bangladesh.",
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
