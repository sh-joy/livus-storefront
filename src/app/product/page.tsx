import { redirect } from 'next/navigation';
import { getAdminProducts } from '@/app/actions/products';

export default async function ProductBasePage() {
  const prods = await getAdminProducts();
  if (prods && prods.length > 0) {
    redirect(`/product/${prods[0].slug}`);
  }
  redirect('/');
}
