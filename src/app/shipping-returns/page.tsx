import type { Metadata } from 'next';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { getSiteContentAction } from '@/app/actions/site-content';

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "LIVUS delivery charges, shipping times across Bangladesh, Cash on Delivery details and our exchange and returns policy.",
  alternates: { canonical: '/shipping-returns' },
};

export const revalidate = 60;

export default async function ShippingReturnsPage() {
  const content = await getSiteContentAction('shipping_page');

  return (
    <InfoPage title="Shipping & Returns">
      <RichText text={content} />
    </InfoPage>
  );
}
