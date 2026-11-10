import { redirect } from 'next/navigation';
import { getProducts } from '@/app/actions/products';

export default async function ProductBasePage() {
  const prods = await getProducts();
  if (prods && prods.length > 0) {
    redirect(`/product/${prods[0].slug}`);
  }
  redirect('/');
}
