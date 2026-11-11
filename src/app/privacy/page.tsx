import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LIVUS collects, uses and protects your personal data when you shop with us.",
  alternates: { canonical: '/privacy' },
};

export const revalidate = 60;

export default async function PrivacyPage() {
  const content = await getSiteContentAction('privacy_page');

  return (
    <InfoPage title="Privacy Policy">
      <RichText text={content} />
    </InfoPage>
  );
}
