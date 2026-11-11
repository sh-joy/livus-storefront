import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "Top-rated and trending LIVUS athletic streetwear and jerseys loved by customers across Bangladesh.",
  alternates: { canonical: '/popular' },
};

export default async function PopularPage() {
  const products = await getProducts('popular');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Popular."
        subtitle="Top rated designs and trending pieces loved by our community."
      />
    </NavigationWrapper>
  );
}
