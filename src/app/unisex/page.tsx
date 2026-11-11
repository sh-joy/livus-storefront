import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "Unisex Athletic Streetwear",
  description: "Versatile LIVUS unisex jerseys and streetwear designed for comfort and performance. Delivered anywhere in Bangladesh.",
  alternates: { canonical: '/unisex' },
};

export default async function UnisexPage() {
  const products = await getProducts('unisex');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Unisex."
        subtitle="Versatile unisex apparel designed for comfort and performance."
      />
    </NavigationWrapper>
  );
}
