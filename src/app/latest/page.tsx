import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function LatestPage() {
  const products = await getProducts('latest');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Latest."
        subtitle="Fresh arrivals and newest drops directly from our design studio."
      />
    </NavigationWrapper>
  );
}
