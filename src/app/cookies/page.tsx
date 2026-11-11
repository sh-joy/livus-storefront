import type { Metadata } from 'next';
import { InfoPage, extractLastUpdated } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "Cookie Policy & Tracking Technologies | LIVUS Online" },
  description:
    "Understand how LIVUS uses necessary and analytics cookies to optimize your shopping experience and learn how to manage your browser cookie preferences.",
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: "Cookie Policy & Tracking Technologies | LIVUS Online",
    description:
      "Understand how LIVUS uses necessary and analytics cookies to optimize your shopping experience and learn how to manage your browser cookie preferences.",
    url: `${siteUrl}/cookies`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Cookie Policy | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Cookie Policy & Tracking Technologies | LIVUS Online",
    description:
      "Understand how LIVUS uses necessary and analytics cookies to optimize your shopping experience and learn how to manage your browser cookie preferences.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

// Re-read content at most once a minute.
export const revalidate = 60;

export default async function CookiesPage() {
  const text = await getSiteContentAction('cookies_page');
  const { date, cleanText } = extractLastUpdated(text);

  return (
    <InfoPage title="Cookie Policy" date={date}>
      <RichText text={cleanText} />
    </InfoPage>
  );
}
