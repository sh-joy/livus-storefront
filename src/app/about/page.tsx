import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS" },
  description:
    "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS",
    description:
      "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
    url: `${siteUrl}/about`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "LIVUS Sportswear Brand" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS",
    description:
      "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const content = await getSiteContentAction('about_page');

  return (
    <InfoPage newsletter title="LIVUS Sportswear Brand">
      <RichText text={content} />
    </InfoPage>
  );
}
