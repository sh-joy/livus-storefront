import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "New Sportswear Arrivals | Latest Drops & Gear | LIVUS" },
  description:
    "Discover new sportswear arrivals at LIVUS. Shop our latest drops of breathable match-day jerseys and training tops released in limited runs across Bangladesh.",
  alternates: { canonical: '/latest' },
  openGraph: {
    title: "New Sportswear Arrivals | Latest Drops & Gear | LIVUS",
    description:
      "Discover new sportswear arrivals at LIVUS. Shop our latest drops of breathable match-day jerseys and training tops released in limited runs across Bangladesh.",
    url: `${siteUrl}/latest`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "New Sportswear Arrivals | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "New Sportswear Arrivals | Latest Drops & Gear | LIVUS",
    description:
      "Discover new sportswear arrivals at LIVUS. Shop our latest drops of breathable match-day jerseys and training tops released in limited runs across Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default async function LatestPage() {
  const products = await getProducts('latest');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Latest."
        subtitle="New sportswear arrivals and match-day drops released in limited runs."
      />
    </NavigationWrapper>
  );
}
