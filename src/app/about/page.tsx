import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "About LIVUS: Athletic Streetwear Culture Bangladesh" },
  description:
    "Learn about LIVUS, an authentic athletic streetwear label in Bangladesh creating modern jerseys and performance essentials for sports and street culture.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: "About LIVUS: Athletic Streetwear Culture Bangladesh",
    description:
      "Learn about LIVUS, an authentic athletic streetwear label in Bangladesh creating modern jerseys and performance essentials for sports and street culture.",
    url: `${siteUrl}/about`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "About LIVUS" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "About LIVUS: Athletic Streetwear Culture Bangladesh",
    description:
      "Learn about LIVUS, an authentic athletic streetwear label in Bangladesh creating modern jerseys and performance essentials for sports and street culture.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const content = await getSiteContentAction('about_page');

  return (
    <InfoPage newsletter title="About LIVUS">
      <RichText text={content} />
    </InfoPage>
  );
}
