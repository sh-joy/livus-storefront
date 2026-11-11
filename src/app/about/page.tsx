import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind LIVUS, a Bangladeshi athletic streetwear brand making jerseys and everyday performance wear.",
  alternates: { canonical: '/about' },
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
