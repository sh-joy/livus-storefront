import type { Metadata } from 'next';
import { InfoPage, extractLastUpdated } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy: Data Protection Notice | LIVUS Online" },
  description:
    "Read how LIVUS protects your personal information and respects your privacy when browsing, creating an account, or placing orders across Bangladesh.",
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: "Privacy Policy: Data Protection Notice | LIVUS Online",
    description:
      "Read how LIVUS protects your personal information and respects your privacy when browsing, creating an account, or placing orders across Bangladesh.",
    url: `${siteUrl}/privacy`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "Privacy Policy | LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Privacy Policy: Data Protection Notice | LIVUS Online",
    description:
      "Read how LIVUS protects your personal information and respects your privacy when browsing, creating an account, or placing orders across Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function PrivacyPage() {
  const content = await getSiteContentAction('privacy_page');
  const { date, cleanText } = extractLastUpdated(content);

  return (
    <InfoPage title="Privacy Policy" date={date}>
      <RichText text={cleanText} />
    </InfoPage>
  );
}
