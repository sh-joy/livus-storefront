import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Unisex Athletic Streetwear & Casual Jerseys | LIVUS" },
  description:
    "Shop versatile unisex athletic wear, relaxed-fit jerseys, and everyday street style essentials designed for everyone. Fast delivery across Bangladesh.",
  alternates: { canonical: '/unisex' },
  openGraph: {
    title: "Unisex Athletic Streetwear & Casual Jerseys | LIVUS",
    description:
      "Shop versatile unisex athletic wear, relaxed-fit jerseys, and everyday street style essentials designed for everyone. Fast delivery across Bangladesh.",
    url: `${siteUrl}/unisex`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Unisex Athletic Streetwear | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Unisex Athletic Streetwear & Casual Jerseys | LIVUS",
    description:
      "Shop versatile unisex athletic wear, relaxed-fit jerseys, and everyday street style essentials designed for everyone. Fast delivery across Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function UnisexPage() {
  const [products, introText] = await Promise.all([
    getProducts('unisex'),
    getSiteContentAction('category_unisex_intro'),
  ]);

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Unisex."
        subtitle={introText || "Versatile unisex apparel designed for comfort and performance."}
      />
    </NavigationWrapper>
  );
}
