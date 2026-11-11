import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Best Sellers: Most-Loved Streetwear & Tops | LIVUS" },
  description:
    "Discover top-rated customer favorites and trending jerseys from LIVUS. Authentic athletic streetwear crafted for peak comfort and style in Bangladesh.",
  alternates: { canonical: '/popular' },
  openGraph: {
    title: "Best Sellers: Most-Loved Streetwear & Tops | LIVUS",
    description:
      "Discover top-rated customer favorites and trending jerseys from LIVUS. Authentic athletic streetwear crafted for peak comfort and style in Bangladesh.",
    url: `${siteUrl}/popular`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Best Sellers | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Best Sellers: Most-Loved Streetwear & Tops | LIVUS",
    description:
      "Discover top-rated customer favorites and trending jerseys from LIVUS. Authentic athletic streetwear crafted for peak comfort and style in Bangladesh.",
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
        subtitle="Top rated designs and trending pieces loved by our community."
      />
    </NavigationWrapper>
  );
}
