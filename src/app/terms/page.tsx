import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms of sale, ordering, payment and legal notices for LIVUS customers in Bangladesh.",
  alternates: { canonical: '/terms' },
};

export const revalidate = 60;

export default async function TermsPage() {
  const content = await getSiteContentAction('terms_page');

  return (
    <InfoPage title="Terms of Service">
      <RichText text={content} />
    </InfoPage>
  );
}
