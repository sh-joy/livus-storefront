import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest LIVUS drops: fresh athletic streetwear and jerseys. Order online with Cash on Delivery across Bangladesh.",
  alternates: { canonical: '/latest' },
};

export default async function LatestPage() {
  const products = await getProducts('latest');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Latest."
        subtitle="Fresh arrivals and newest drops directly from our design studio."
      />
    </NavigationWrapper>
  );
}
