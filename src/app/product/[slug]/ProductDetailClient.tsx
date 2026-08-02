'use client';

import ProductDetails from '@/imports/ProductDetails-1';
import type { ProductItem } from '@/app/actions/products';

interface VariantDetail {
  id: string;
  name: string;
  hexColor: string;
  thumbnailUrl: string;
  isLowStock: boolean;
  galleryImages: string[];
  sizes: { size: string; sku: string | null; quantity: number; isStockOut: boolean }[];
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    specifications: string;
    collectionTag: string;
    categorySlug?: string;
    priceBdt: number;
    price: string;
    compareAtPriceBdt?: number;
    colorVariants: VariantDetail[];
  };
  allProducts?: ProductItem[];
}

export default function ProductDetailClient({ product, allProducts = [] }: ProductDetailProps) {
  return <ProductDetails product={product} allProducts={allProducts} />;
}
