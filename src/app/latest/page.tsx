import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "New Arrivals: Latest Drops & Fresh Jerseys | LIVUS" },
  description:
    "Check out the newest athletic streetwear drops and freshest jersey designs from LIVUS. Explore modern cuts and seasonal pieces available in Bangladesh.",
  alternates: { canonical: '/latest' },
  openGraph: {
    title: "New Arrivals: Latest Drops & Fresh Jerseys | LIVUS",
    description:
      "Check out the newest athletic streetwear drops and freshest jersey designs from LIVUS. Explore modern cuts and seasonal pieces available in Bangladesh.",
    url: `${siteUrl}/latest`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "New Arrivals | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "New Arrivals: Latest Drops & Fresh Jerseys | LIVUS",
    description:
      "Check out the newest athletic streetwear drops and freshest jersey designs from LIVUS. Explore modern cuts and seasonal pieces available in Bangladesh.",
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
        subtitle="Fresh arrivals and newest drops directly from our design studio."
      />
    </NavigationWrapper>
  );
}
