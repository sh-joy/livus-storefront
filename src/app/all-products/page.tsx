import { getProducts } from '@/app/actions/products';
import AllProductsClient from './AllProductsClient';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function AllProductsPage() {
  const products = await getProducts();

  return (
    <NavigationWrapper>
      <AllProductsClient products={products} />
    </NavigationWrapper>
  );
}
