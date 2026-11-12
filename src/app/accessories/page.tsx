import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Sports Accessories Bangladesh | Match Day Gear | LIVUS" },
  description:
    "Shop sports accessories in Bangladesh from LIVUS. Athletic essentials to complete your look. Fast nationwide delivery with Cash on Delivery. Find your gear.",
  alternates: { canonical: '/accessories' },
  openGraph: {
    title: "Sports Accessories Bangladesh | Match Day Gear | LIVUS",
    description:
      "Shop sports accessories in Bangladesh from LIVUS. Athletic essentials to complete your look. Fast nationwide delivery with Cash on Delivery. Find your gear.",
    url: `${siteUrl}/accessories`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Sports Accessories Bangladesh | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sports Accessories Bangladesh | Match Day Gear | LIVUS",
    description:
      "Shop sports accessories in Bangladesh from LIVUS. Athletic essentials to complete your look. Fast nationwide delivery with Cash on Delivery. Find your gear.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function AccessoriesPage() {
  const [products, introText] = await Promise.all([
    getProducts('accessories'),
    getSiteContentAction('category_accessories_intro'),
  ]);

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Accessories."
        subtitle={introText || "Essential accessories to complete your LIVUS look."}
      />
    </NavigationWrapper>
  );
}
