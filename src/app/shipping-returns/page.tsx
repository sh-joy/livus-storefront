import type { Metadata } from 'next';
import { InfoPage, extractLastUpdated } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "Shipping Policy & Exchange Guidelines | LIVUS Online" },
  description:
    "Learn about LIVUS delivery schedules across Dhaka and all Bangladesh districts, Cash on Delivery options, and our straightforward 7-day exchange policy.",
  alternates: { canonical: '/shipping-returns' },
  openGraph: {
    title: "Shipping Policy & Exchange Guidelines | LIVUS Online",
    description:
      "Learn about LIVUS delivery schedules across Dhaka and all Bangladesh districts, Cash on Delivery options, and our straightforward 7-day exchange policy.",
    url: `${siteUrl}/shipping-returns`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Shipping & Returns | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shipping Policy & Exchange Guidelines | LIVUS Online",
    description:
      "Learn about LIVUS delivery schedules across Dhaka and all Bangladesh districts, Cash on Delivery options, and our straightforward 7-day exchange policy.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function ShippingReturnsPage() {
  const content = await getSiteContentAction('shipping_page');
  const { date, cleanText } = extractLastUpdated(content);

  return (
    <InfoPage title="Shipping & Returns" date={date}>
      <RichText text={cleanText} />
    </InfoPage>
  );
}
