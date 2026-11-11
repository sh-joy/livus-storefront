import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlugAction, getProducts } from '@/app/actions/products';
import ProductDetailClient from './ProductDetailClient';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Shared between generateMetadata and the page so the product is fetched once per request.
const getProduct = cache((slug: string) => getProductBySlugAction(slug));

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlugAction>>>;

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getProductImages(product: Product): string[] {
  const images: string[] = [];
  for (const variant of product.colorVariants || []) {
    for (const img of variant.galleryImages || []) {
      if (img && !images.includes(img)) images.push(img);
    }
    if (variant.thumbnailUrl && !images.includes(variant.thumbnailUrl)) images.push(variant.thumbnailUrl);
  }
  return images;
}

function isInStock(product: Product) {
  return (product.colorVariants || []).some((v) =>
    (v.sizes || []).some((s: { quantity?: number | null; isStockOut?: boolean | null }) =>
      (s.quantity ?? 0) > 0 && !s.isStockOut
    )
  );
}

function getDescription(product: Product) {
  const raw = (product.description || '').replace(/\s+/g, ' ').trim();
  const base = raw && raw !== product.name
    ? raw
    : `${product.name} — athletic streetwear by LIVUS.`;
  const suffix = ` ৳${product.priceBdt.toLocaleString('en-US')} · Cash on Delivery across Bangladesh.`;
  const max = 160 - suffix.length;
  return (base.length > max ? `${base.slice(0, max - 1).trimEnd()}…` : base) + suffix;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product not found',
      robots: { index: false, follow: true },
    };
  }

  const path = `/product/${product.slug}`;
  const description = getDescription(product);
  const firstImage = getProductImages(product)[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${product.name} | LIVUS`,
      description,
      url: path,
      siteName: 'LIVUS',
      locale: 'en_BD',
      type: 'website',
      // When there is no product photo, omit `images` so the site-wide
      // opengraph-image is used instead.
      ...(firstImage ? { images: [{ url: toAbsoluteUrl(firstImage), alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
    },
    other: {
      'product:price:amount': String(product.priceBdt),
      'product:price:currency': 'BDT',
      'product:availability': isInStock(product) ? 'in stock' : 'out of stock',
    },
  };
}

function buildProductJsonLd(product: Product) {
  const url = `${siteUrl}/product/${product.slug}`;
  const images = getProductImages(product).map(toAbsoluteUrl);
  const sku = product.colorVariants?.[0]?.sizes?.[0]?.sku;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.description || product.name).replace(/\s+/g, ' ').trim(),
    url,
    ...(images.length ? { image: images } : {}),
    ...(sku ? { sku } : {}),
    productID: product.id,
    brand: { '@type': 'Brand', name: 'LIVUS' },
    ...(product.colorVariants?.length
      ? { color: product.colorVariants.map((v) => v.name).filter(Boolean).join(', ') }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BDT',
      price: String(product.priceBdt),
      availability: isInStock(product)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'LIVUS' },
    },
  };
}

export default async function DynamicProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const [productData, allProducts] = await Promise.all([
    getProduct(resolvedParams.slug),
    getProducts(),
  ]);

  if (!productData) {
    notFound();
  }

  const jsonLd = buildProductJsonLd(productData);

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so product text cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetailClient product={productData} allProducts={allProducts} />
    </>
  );
}
