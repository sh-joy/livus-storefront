import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import { getSiteContentAction } from '@/app/actions/site-content';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Streetwear & Athletic Accessories Online | LIVUS BD" },
  description:
    "Complete your athletic look with premium LIVUS caps, sports socks, gym bags, and everyday lifestyle accessories. Fast shipping throughout Bangladesh.",
  alternates: { canonical: '/accessories' },
  openGraph: {
    title: "Streetwear & Athletic Accessories Online | LIVUS BD",
    description:
      "Complete your athletic look with premium LIVUS caps, sports socks, gym bags, and everyday lifestyle accessories. Fast shipping throughout Bangladesh.",
    url: `${siteUrl}/accessories`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Athletic Accessories | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Streetwear & Athletic Accessories Online | LIVUS BD",
    description:
      "Complete your athletic look with premium LIVUS caps, sports socks, gym bags, and everyday lifestyle accessories. Fast shipping throughout Bangladesh.",
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
