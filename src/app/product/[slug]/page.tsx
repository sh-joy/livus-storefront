import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getProductBySlugAction, getProducts } from '@/app/actions/products';
import ProductDetailClient from './ProductDetailClient';
import { getSiteContentAction } from '@/app/actions/site-content';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { SHIPPING_POLICY_DEFAULTS } from '@/content/policy-defaults';
import { getDefaultDeliveryChargeBdt, DELIVERY_CHARGE_BDT } from '@/lib/order-pricing';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const revalidate = 60;

// Shared between generateMetadata and the page so the product is fetched once per request.
const getProduct = cache((slug: string) => getProductBySlugAction(slug));

export type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlugAction>>>;

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

export function getProductTitle(product: {
  name: string;
  categorySlug?: string;
  collectionTag?: string;
}): { absolute: string } {
  const gender =
    product.categorySlug === 'for-her'
      ? "Women's"
      : product.categorySlug === 'for-him'
      ? "Men's"
      : product.categorySlug === 'accessories'
      ? "Sports"
      : (product.name.toLowerCase().includes('women') ? "Women's" : "Men's");

  const rawType = (product.collectionTag && product.collectionTag !== 'Minimal')
    ? product.collectionTag
    : (product.name.toLowerCase().includes('jersey')
      ? 'Jersey'
      : product.name.toLowerCase().includes('tee') || product.name.toLowerCase().includes('t-shirt')
      ? 'Training Tee'
      : 'Sportswear');

  const base = `${product.name} | ${gender} ${rawType} | LIVUS`;
  if (base.length >= 50 && base.length <= 60) return { absolute: base };
  if (base.length < 50) {
    const longer = `${product.name} | ${gender} Athletic ${rawType} | LIVUS`;
    if (longer.length >= 50 && longer.length <= 60) return { absolute: longer };
    const longest = `${product.name} | ${gender} Performance ${rawType} | LIVUS`;
    if (longest.length >= 50 && longest.length <= 60) return { absolute: longest.slice(0, 60) };
    const padded = `${product.name} | ${gender} Sportswear & Athletic Jerseys | LIVUS`;
    if (padded.length <= 60) return { absolute: padded };
    return { absolute: base };
  }
  return { absolute: base.slice(0, 60) };
}

export function getDescription(product: Product) {
  const colours = (product.colorVariants || []).map((v) => v.name).filter(Boolean);
  const colourText = colours.length ? ` in ${colours.slice(0, 2).join(' and ')}` : '';

  let fabric = '';
  let fit = '';
  if (product.specifications) {
    const fabricMatch = product.specifications.match(/Fabric:\s*([^\n;]+)/i);
    if (fabricMatch) fabric = fabricMatch[1].trim();
    const fitMatch = product.specifications.match(/Fit:\s*([^\n;]+)/i);
    if (fitMatch) fit = fitMatch[1].trim();
  }

  const specParts = [fit, fabric].filter(Boolean);
  const specText = specParts.length ? ` Featuring ${specParts.join(', ')}.` : '';

  const suffix = ' Delivery across Bangladesh.';
  const prefix = `Shop the ${product.name}${colourText} by LIVUS.${specText} Built for training and athletic movement.`;

  let text = `${prefix.trim()}${suffix}`;
  if (text.length > 160) {
    const maxPrefixLen = 160 - suffix.length;
    text = `${prefix.slice(0, maxPrefixLen - 1).trimEnd()}…${suffix}`;
  } else if (text.length < 140) {
    const padding = ' Nationwide Cash on Delivery.';
    if (text.length + padding.length <= 160) {
      text = `${prefix.trim()}${padding}${suffix}`;
    } else {
      text = `${prefix.trim()} with COD.${suffix}`;
    }
  }

  if (text.length < 140) {
    text = text.replace(suffix, ` Fast shipping and COD.${suffix}`);
  }
  if (text.length > 160) {
    text = `${text.slice(0, 159 - suffix.length).trimEnd()}…${suffix}`;
  }

  return text;
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
  const titleObj = getProductTitle(product);

  return {
    title: titleObj,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: titleObj.absolute,
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
      title: titleObj.absolute,
      description,
      images: firstImage ? [toAbsoluteUrl(firstImage)] : [`${siteUrl}/opengraph-image`],
    },
    other: {
      'product:price:amount': String(product.priceBdt),
      'product:price:currency': 'BDT',
      'product:availability': isInStock(product) ? 'in stock' : 'out of stock',
    },
  };
}

export function buildProductJsonLd(product: Product, deliveryChargeBdt: number = DELIVERY_CHARGE_BDT) {
  const url = `${siteUrl}/product/${product.slug}`;
  const images = getProductImages(product).map(toAbsoluteUrl);
  const sku = product.colorVariants?.[0]?.sizes?.[0]?.sku || product.slug;
  const rawType = (product.collectionTag && product.collectionTag !== 'Minimal')
    ? product.collectionTag
    : (product.name.toLowerCase().includes('jersey')
      ? 'Jerseys'
      : product.name.toLowerCase().includes('tee') || product.name.toLowerCase().includes('t-shirt')
      ? 'Training Tees'
      : 'Jerseys');

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    category: `Sportswear > ${rawType}`,
    description: (product.description || product.name).replace(/\s+/g, ' ').trim(),
    url,
    image: images.length ? images : [`${siteUrl}/opengraph-image`],
    sku,
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
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: String(deliveryChargeBdt),
          currency: 'BDT',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'BD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: SHIPPING_POLICY_DEFAULTS.handlingDaysMin,
            maxValue: SHIPPING_POLICY_DEFAULTS.handlingDaysMax,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: SHIPPING_POLICY_DEFAULTS.transitDaysMin,
            maxValue: SHIPPING_POLICY_DEFAULTS.transitDaysMax,
            unitCode: 'd',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'BD',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: SHIPPING_POLICY_DEFAULTS.returnDays,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
      },
    },
  };
}

export default async function DynamicProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const [productData, allProducts, shippingText, defaultDelivery] = await Promise.all([
    getProduct(resolvedParams.slug),
    getProducts(),
    getSiteContentAction('shipping_returns'),
    getDefaultDeliveryChargeBdt(),
  ]);

  if (!productData) {
    notFound();
  }

  const jsonLd = buildProductJsonLd(productData, defaultDelivery);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Shop All', path: '/all-products' },
          { name: productData.name, path: `/product/${productData.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        // Escape "<" so product text cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetailClient product={productData} allProducts={allProducts} shippingText={shippingText} />
    </>
  );
}
