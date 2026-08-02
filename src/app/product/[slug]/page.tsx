import { notFound } from "next/navigation";
import { getProductBySlugAction, getProducts } from "@/app/actions/products";
import ProductDetailClient from "./ProductDetailClient";

export default async function DynamicProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  const [productData, allProducts] = await Promise.all([
    getProductBySlugAction(resolvedParams.slug),
    getProducts(),
  ]);

  if (!productData) {
    notFound();
  }

  return <ProductDetailClient product={productData} allProducts={allProducts} />;
}
