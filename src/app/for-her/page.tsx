import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHer from '@/imports/ForHer';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Women's Sportswear Bangladesh | Activewear Tops | LIVUS" },
  description:
    "Shop women's sportswear in Bangladesh at LIVUS. Breathable activewear, gym wear and sports tops. Nationwide delivery with Cash on Delivery. Find your fit.",
  alternates: { canonical: '/for-her' },
  openGraph: {
    title: "Women's Sportswear Bangladesh | Activewear Tops | LIVUS",
    description:
      "Shop women's sportswear in Bangladesh at LIVUS. Breathable activewear, gym wear and sports tops. Nationwide delivery with Cash on Delivery. Find your fit.",
    url: `${siteUrl}/for-her`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Women's Sportswear Bangladesh | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Women's Sportswear Bangladesh | Activewear Tops | LIVUS",
    description:
      "Shop women's sportswear in Bangladesh at LIVUS. Breathable activewear, gym wear and sports tops. Nationwide delivery with Cash on Delivery. Find your fit.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function ForHerPage() {
  const [products, introText] = await Promise.all([
    getProducts('for-her'),
    getSiteContentAction('category_for_her_intro'),
  ]);

  return (
    <NavigationWrapper>
      <ForHer products={products} subtitle={introText} />
    </NavigationWrapper>
  );
}
