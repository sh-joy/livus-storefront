import type { Metadata } from 'next';
import { getProducts } from '@/app/actions/products';
import AllProductsClient from './AllProductsClient';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export const metadata: Metadata = {
  title: "Shop All Products",
  description: "Browse the full LIVUS range of athletic streetwear, jerseys, tees and accessories. Cash on Delivery, bKash and Nagad across Bangladesh.",
  alternates: { canonical: '/all-products' },
};

export default async function AllProductsPage() {
  const products = await getProducts();

  return (
    <NavigationWrapper>
      <AllProductsClient products={products} />
    </NavigationWrapper>
  );
}
