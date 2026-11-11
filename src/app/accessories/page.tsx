import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "Accessories",
  description: "Essential accessories to complete your LIVUS look. Nationwide delivery in Bangladesh with Cash on Delivery.",
  alternates: { canonical: '/accessories' },
};

export default async function AccessoriesPage() {
  const products = await getProducts('accessories');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Accessories."
        subtitle="Essential accessories to complete your LIVUS look."
      />
    </NavigationWrapper>
  );
}
