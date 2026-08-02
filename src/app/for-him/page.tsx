import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function ForHimPage() {
  const products = await getProducts('for-him');

  return (
    <NavigationWrapper>
      <ForHim products={products} />
    </NavigationWrapper>
  );
}
