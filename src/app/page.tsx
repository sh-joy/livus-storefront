import { getPopularProductsAction } from '@/app/actions/products';
import Homepage from '@/imports/Homepage';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function Page() {
  const popularProducts = await getPopularProductsAction(12);

  return (
    <NavigationWrapper>
      <Homepage products={popularProducts} />
    </NavigationWrapper>
  );
}
