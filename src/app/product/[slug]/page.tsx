import type { Metadata } from 'next';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://livus.com.bd';
  try {
    if (db) {
      const prod = await db.query.products.findFirst({
        where: eq(products.slug, slug),
        with: {
          colorVariants: {
            with: { variantImages: true },
          },
        },
      });

      if (prod) {
        const title = `${prod.name} | LIVUS Premium Streetwear`;
        const description = (prod.description || 'Premium performance streetwear apparel engineered by LIVUS.').slice(0, 160);
        const img = prod.colorVariants?.[0]?.variantImages?.[0]?.imageUrl || prod.colorVariants?.[0]?.thumbnailUrl || '/images/for_him.jpg';
        const absoluteImg = img.startsWith('http') ? img : `${baseUrl}${img}`;

        return {
          title,
          description,
          alternates: { canonical: `${baseUrl}/product/${prod.slug}` },
          openGraph: {
            title,
            description,
            url: `${baseUrl}/product/${prod.slug}`,
            siteName: 'LIVUS',
            images: [{ url: absoluteImg, width: 800, height: 1000, alt: prod.name }],
            type: 'website',
          },
        };
      }
    }
  } catch (e) {
    // fallback
  }

  return {
    title: 'Apparel Product | LIVUS',
    description: 'Explore premium streetwear from LIVUS Atelier.',
  };
}

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
