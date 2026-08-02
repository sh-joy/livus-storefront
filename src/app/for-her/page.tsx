import { getProducts } from '@/app/actions/products';
import ForHer from '@/imports/ForHer';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function ForHerPage() {
  const products = await getProducts('for-her');

  return (
    <NavigationWrapper>
      <ForHer products={products} />
    </NavigationWrapper>
  );
}
