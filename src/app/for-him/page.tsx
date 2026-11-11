import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "Men's Athletic Streetwear & Jerseys",
  description: "Shop LIVUS men's jerseys, tees and athletic streetwear built for training and everyday wear. Nationwide delivery in Bangladesh.",
  alternates: { canonical: '/for-him' },
};

export default async function ForHimPage() {
  const products = await getProducts('for-him');

  return (
    <NavigationWrapper>
      <ForHim products={products} />
    </NavigationWrapper>
  );
}
