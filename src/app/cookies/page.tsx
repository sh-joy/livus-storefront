import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { fetchStoreSettingsAction } from '@/app/actions/checkout';
import { cookiesPolicyText } from '@/content/policy-defaults';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How LIVUS uses cookies and similar technologies, and how you can control them.',
  alternates: { canonical: '/cookies' },
};

// Re-read store contact details from Admin → Settings at most once a minute.
export const revalidate = 60;

export default async function CookiesPage() {
  const s = await fetchStoreSettingsAction();
  const text = cookiesPolicyText({
    supportEmail: s?.supportEmail || 'support@livus.com.bd',
    supportPhone: s?.supportPhone || '',
  });
  return (
    <InfoPage title="Cookie Policy">
      <RichText text={text} />
    </InfoPage>
  );
}
