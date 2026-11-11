import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How LIVUS uses cookies and similar technologies, and how you can control them.',
  alternates: { canonical: '/cookies' },
};

// Re-read content at most once a minute.
export const revalidate = 60;

export default async function CookiesPage() {
  const text = await getSiteContentAction('cookies_page');
  return (
    <InfoPage title="Cookie Policy">
      <RichText text={text} />
    </InfoPage>
  );
}
