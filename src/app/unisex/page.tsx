import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

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
