import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import ForHer from '@/imports/ForHer';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Women's Athletic Streetwear",
  description: "Shop LIVUS women's athletic streetwear, jerseys and activewear. Cash on Delivery, bKash and Nagad across Bangladesh.",
  alternates: { canonical: '/for-her' },
};

export default async function ForHerPage() {
  const products = await getProducts('for-her');

  return (
    <NavigationWrapper>
      <ForHer products={products} />
    </NavigationWrapper>
  );
}
