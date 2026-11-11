import type { Metadata } from 'next';
import { InfoPage, extractLastUpdated } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "Terms of Service & Customer Agreement | LIVUS Online" },
  description:
    "Review the official terms and conditions for ordering, shipping, payments, exchanges, and customer accounts on the LIVUS online store in Bangladesh.",
  alternates: { canonical: '/terms' },
  openGraph: {
    title: "Terms of Service & Customer Agreement | LIVUS Online",
    description:
      "Review the official terms and conditions for ordering, shipping, payments, exchanges, and customer accounts on the LIVUS online store in Bangladesh.",
    url: `${siteUrl}/terms`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Terms of Service | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Terms of Service & Customer Agreement | LIVUS Online",
    description:
      "Review the official terms and conditions for ordering, shipping, payments, exchanges, and customer accounts on the LIVUS online store in Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function TermsPage() {
  const content = await getSiteContentAction('terms_page');
  const { date, cleanText } = extractLastUpdated(content);

  return (
    <InfoPage title="Terms of Service" date={date}>
      <RichText text={cleanText} />
    </InfoPage>
  );
}
