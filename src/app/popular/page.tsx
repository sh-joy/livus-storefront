import { getProducts } from '@/app/actions/products';
import ForHim from '@/imports/ForHim-2';
import { NavigationWrapper } from '@/components/NavigationWrapper';

export default async function PopularPage() {
  const products = await getProducts('popular');

  return (
    <NavigationWrapper>
      <ForHim
        products={products}
        title="Popular."
        subtitle="Top rated designs and trending pieces loved by our community."
      />
    </NavigationWrapper>
  );
}
