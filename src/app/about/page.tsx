import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind LIVUS, a Bangladeshi athletic streetwear brand making jerseys and everyday performance wear.",
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <InfoPage newsletter title="About LIVUS">
      <p>LIVUS is a contemporary Bangladeshi streetwear atelier focused on architectural silhouettes, heavy cotton fabrications, and minimalist luxury.</p>
      <p>Designed in Dhaka, our pieces bridge functional sports performance with runway aesthetic standards.</p>
    </InfoPage>
  );
}
