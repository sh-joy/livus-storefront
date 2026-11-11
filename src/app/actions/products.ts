'use server';

import { requireAdmin } from '@/lib/admin-guard';
import { db } from '@/db';
import { products, colorVariants, variantImages, stockInventory, categories } from '@/db/schema';
import { CreateProductSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

import { generateCleanSku } from '@/lib/utils';

export async function parseSizeMatrix(specStr?: string | null) {
  if (!specStr) return null;
  try {
    const parsed = JSON.parse(specStr);
    if (parsed && Array.isArray(parsed.sizeMatrix)) {
      return parsed.sizeMatrix;
    }
  } catch (e) {
    // Not JSON
  }
  return null;
}
import { eq, desc, inArray } from 'drizzle-orm';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceBdt: number;
  price: string;
  imageUrl?: string;
  originalPriceBdt?: number;
  compareAtPriceBdt?: number;
  collectionTag?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  colorName?: string;
  thumbnailUrl?: string;
  isLowStock?: boolean;
  createdAt?: string | Date;
  sizes?: string[];
  galleryImages?: string[];
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  collectionTag: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  priceBdt: number;
  compareAtPriceBdt?: number;
  imageUrl?: string;
  isActive: boolean;
  variantsCount: number;
  colors: string[];
  colorVariantDetails?: {
    name: string;
    isLowStock: boolean;
    stock: number;
    sizeInventory?: {
      size: string;
      quantity: number;
      isStockOut: boolean;
      isLowStock: boolean;
    }[];
  }[];
  totalUnits: number;
  isLowStock: boolean;
  createdAt?: Date;
  sizes?: string[];
  galleryImages?: string[];
}

export async function getCategoriesAction() {
  if (!db) return [];
  try {
    const res = await db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
    });
    return res.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [
      { id: '14d5283d-d8e9-4272-a54b-a8ff4babdea1', name: 'For Him (Men)', slug: 'for-him' },
      { id: 'efe6b73c-ca48-40ed-98a9-867c74364871', name: 'For Her (Women)', slug: 'for-her' },
      { id: '3f196f7d-dc4d-4df1-a192-367cab666cc7', name: 'Unisex / Minimal', slug: 'unisex' },
    ];
  }
}

export async function checkSlugUniqueAction(slug: string, currentProductId?: string) {
  if (!db || !slug) return { isUnique: true };
  try {
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug.toLowerCase().trim()),
    });
    if (existing && currentProductId && existing.id === currentProductId) {
      return { isUnique: true };
    }
    return { isUnique: !existing };
  } catch (error) {
    return { isUnique: true };
  }
}

export async function getProductByIdAction(productId: string) {
  await requireAdmin();
  if (!db || !productId) return null;

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        colorVariants: {
          with: {
            variantImages: true,
            stockInventory: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      title: product.name,
      slug: product.slug,
      description: product.description || "",
      specifications: product.specifications || "",
      collectionTag: product.collectionTag || "Minimal",
      categoryId: product.categoryId || "",
      basePrice: String(product.priceBdt),
      compareAtPrice: product.compareAtPriceBdt ? String(product.compareAtPriceBdt) : "",
      isActive: product.isActive,
      colorVariants: product.colorVariants.map((v, idx) => {
        const sizesList = ["S", "M", "L", "XL", "XXL"].map((szName) => {
          const found = v.stockInventory.find((s) => s.size === szName);
          return {
            size: szName as "S" | "M" | "L" | "XL" | "XXL",
            enabled: !!found,
            sku: found?.sku || szName,
            quantity: found?.quantity || 0,
          };
        });

        return {
          id: v.id,
          colorName: v.name,
          hexCode: v.hexColor || "#000000",
          coverPhoto: v.thumbnailUrl || "/images/for_him.jpg",
          isLowStock: v.isLowStock,
          galleryPhotos: v.variantImages.map((img) => img.imageUrl),
          sizes: sizesList,
        };
      }),
    };
  } catch (error) {
    console.error("Failed to fetch product by id:", error);
    return null;
  }
}

export async function getProductBySlugAction(slug: string) {
  if (!slug) return null;

  try {
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    if (db) {
      let product = await db.query.products.findFirst({
        where: eq(products.slug, cleanSlug),
        with: {
          colorVariants: {
            with: {
              variantImages: true,
              stockInventory: true,
            },
          },
        },
      });

      if (!product && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug)) {
        product = await db.query.products.findFirst({
          where: eq(products.id, cleanSlug),
          with: {
            colorVariants: {
              with: {
                variantImages: true,
                stockInventory: true,
              },
            },
          },
        });
      }

      if (!product) {
        const allDbProds = await db.query.products.findMany({
          with: {
            colorVariants: {
              with: {
                variantImages: true,
                stockInventory: true,
              },
            },
          },
        });
        product = allDbProds.find(
          (p) =>
            (p.slug && p.slug.toLowerCase() === cleanSlug) ||
            (p.id && p.id.toLowerCase() === cleanSlug) ||
            (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === cleanSlug)
        );
      }

      // Draft / deactivated products are not visible on the storefront
      if (product && !product.isActive) return null;

      if (product) {
        const sizeMatrix = await parseSizeMatrix(product.specifications);
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          specifications: product.specifications || "",
          sizeMatrix,
          collectionTag: product.collectionTag || "Minimal",
          categoryId: product.categoryId || undefined,
          priceBdt: product.priceBdt,
          price: String(product.priceBdt),
          compareAtPriceBdt: product.compareAtPriceBdt || undefined,
          isActive: product.isActive,
          colorVariants: (product.colorVariants || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            hexColor: v.hexColor || "#000000",
            thumbnailUrl: v.thumbnailUrl,
            isLowStock: v.isLowStock,
            galleryImages: (v.variantImages || []).map((img: any) => img.imageUrl),
            sizes: (v.stockInventory || []).map((s: any) => ({
              size: s.size,
              sku: s.sku,
              quantity: s.quantity,
              isStockOut: s.isStockOut,
            })),
          })),
        };
      }
    }

    const adminRows = await getAdminProducts({ status: 'active' });
    const foundRow = adminRows.find(
      (r) =>
        (r.slug && r.slug.toLowerCase() === cleanSlug) ||
        (r.id && r.id.toLowerCase() === cleanSlug) ||
        (r.name && r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === cleanSlug)
    );

    if (foundRow) {
      return {
        id: foundRow.id,
        name: foundRow.name,
        slug: foundRow.slug,
        description: foundRow.name,
        specifications: "Fabric: 100% Breathable Polyester\nFit: Athletic Race Fit\nWeight: 140 GSM\nCare: Machine wash cold",
        sizeMatrix: [
          { size: "S", chest: "36-38 in", length: "27 in", sleeve: "8 in" },
          { size: "M", chest: "38-40 in", length: "28 in", sleeve: "8.5 in" },
          { size: "L", chest: "40-42 in", length: "29 in", sleeve: "9 in" },
          { size: "XL", chest: "42-44 in", length: "30 in", sleeve: "9.5 in" },
          { size: "XXL", chest: "44-46 in", length: "31 in", sleeve: "10 in" },
        ],
        collectionTag: foundRow.collectionTag || "Minimal",
        categoryId: foundRow.categoryId,
        categorySlug: foundRow.categorySlug,
        priceBdt: foundRow.priceBdt,
        price: String(foundRow.priceBdt),
        compareAtPriceBdt: foundRow.compareAtPriceBdt,
        isActive: foundRow.isActive,
        colorVariants: (foundRow.colorVariantDetails && foundRow.colorVariantDetails.length > 0)
          ? foundRow.colorVariantDetails.map((v, i) => ({
              id: `${foundRow.id}-var-${i}`,
              name: v.name,
              hexColor: "#000000",
              thumbnailUrl: foundRow.imageUrl || "/images/for_him.jpg",
              isLowStock: v.isLowStock,
              galleryImages: foundRow.galleryImages && foundRow.galleryImages.length > 0 ? foundRow.galleryImages : [foundRow.imageUrl || "/images/for_him.jpg"],
              sizes: (v.sizeInventory || []).map((s) => ({
                size: s.size,
                sku: `${foundRow.slug}-${s.size}`,
                quantity: s.quantity,
                isStockOut: s.isStockOut,
              })),
            }))
          : [
              {
                id: `${foundRow.id}-default`,
                name: "Default",
                hexColor: "#000000",
                thumbnailUrl: foundRow.imageUrl || "/images/for_him.jpg",
                isLowStock: false,
                galleryImages: foundRow.galleryImages && foundRow.galleryImages.length > 0 ? foundRow.galleryImages : [foundRow.imageUrl || "/images/for_him.jpg"],
                sizes: [
                  { size: "S", sku: `${foundRow.slug}-S`, quantity: 10, isStockOut: false },
                  { size: "M", sku: `${foundRow.slug}-M`, quantity: 10, isStockOut: false },
                  { size: "L", sku: `${foundRow.slug}-L`, quantity: 10, isStockOut: false },
                  { size: "XL", sku: `${foundRow.slug}-XL`, quantity: 5, isStockOut: false },
                  { size: "XXL", sku: `${foundRow.slug}-XXL`, quantity: 0, isStockOut: true },
                ],
              },
            ],
      };
    }

    // Unknown or inactive product: the page shows a proper 404 instead of inventing one.
    return null;
  } catch (error) {
    console.error("Failed to fetch product by slug:", error);
    return null;
  }
}

const catalogProducts: any[] = [
  {
    id: "prod-1",
    name: "OWAYO - CROSS FADE",
    slug: "owayo-cross-fade",
    priceBdt: 899,
    compareAtPriceBdt: 1199,
    collectionTag: "Minimal",
    isActive: true,
    colorVariants: [
      {
        id: "var-1",
        name: "Primary",
        thumbnailUrl: "/images/for_him.jpg",
        isLowStock: false,
        stockInventory: [
          { size: "S", quantity: 10, isStockOut: false },
          { size: "M", quantity: 10, isStockOut: false },
          { size: "L", quantity: 10, isStockOut: false },
          { size: "XL", quantity: 5, isStockOut: false },
        ],
      },
    ],
  },
  {
    id: "prod-2",
    name: "APEX - GEOMETRIC MESH",
    slug: "apex-geometric-jersey",
    priceBdt: 1250,
    compareAtPriceBdt: 1550,
    collectionTag: "Minimal",
    isActive: true,
    colorVariants: [
      {
        id: "var-2",
        name: "Primary",
        thumbnailUrl: "/images/for_her.jpg",
        isLowStock: false,
        stockInventory: [
          { size: "S", quantity: 10, isStockOut: false },
          { size: "M", quantity: 10, isStockOut: false },
          { size: "L", quantity: 10, isStockOut: false },
        ],
      },
    ],
  },
];

export async function getAdminProducts(params?: { search?: string; collection?: string; status?: string; categorySlug?: string }): Promise<ProductRow[]> {
  try {
    let allProducts: any[] = [];
    if (db) {
      try {
        allProducts = await db.query.products.findMany({
          orderBy: [desc(products.createdAt)],
          with: {
            colorVariants: {
              with: {
                stockInventory: true,
                variantImages: true,
              },
            },
            category: true,
          },
        });
      } catch (queryErr) {
        console.warn("Relational query fallback:", queryErr);
      }
    }
    if (!allProducts || allProducts.length === 0) {
      allProducts = catalogProducts;
    }

    let filtered = allProducts;

    if (params?.search) {
      const query = params.search.toLowerCase();
      filtered = filtered.filter((p: any) => {
        const matchTitle = p.name?.toLowerCase().includes(query);
        const matchSlug = p.slug?.toLowerCase().includes(query);
        const matchTag = p.collectionTag && p.collectionTag.toLowerCase().includes(query);

        // SKU matching across all color variants and size inventory
        const matchSku = (p.colorVariants || []).some((v: any) =>
          v.name?.toLowerCase().includes(query) ||
          (v.stockInventory || []).some((inv: any) =>
            inv.sku?.toLowerCase().includes(query)
          )
        );

        // Dynamic SKU pattern matching (e.g., LIV-SH-HER-300726 or LIV-SH-HIM-300726)
        const categoryCode = p.category?.slug === "for-her" ? "HER" : p.category?.slug === "for-him" ? "HIM" : "UNI";
        const dateCode = p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB").replace(/\//g, "").slice(0, 6) : "300726";
        const generatedBaseSku = `LIV-SH-${categoryCode}-${dateCode}`.toLowerCase();
        const matchGeneratedSku = generatedBaseSku.includes(query);

        return matchTitle || matchSlug || matchTag || matchSku || matchGeneratedSku;
      });
    }

    if (params?.collection && params.collection !== "all") {
      filtered = filtered.filter(p => p.collectionTag === params.collection || p.categoryId === params.collection);
    }

    if (params?.categorySlug) {
      filtered = filtered.filter(p => p.category?.slug === params.categorySlug);
    }

    if (params?.status && params.status !== "all") {
      if (params.status === "active") filtered = filtered.filter(p => p.isActive);
      if (params.status === "draft") filtered = filtered.filter(p => !p.isActive);
      if (params.status === "low_stock") {
        filtered = filtered.filter(p => (p.colorVariants || []).some((v: any) => v.isLowStock));
      }
    }

    return filtered.map(p => {
      const totalUnits = (p.colorVariants || []).reduce((sum: number, v: any) => {
        return sum + (v.stockInventory || []).reduce((s: number, inv: any) => s + inv.quantity, 0);
      }, 0);

      const hasLowStock = (p.colorVariants || []).some((v: any) => v.isLowStock);
      const thumb = p.colorVariants?.[0]?.thumbnailUrl || '/images/for_him.jpg';

      const colorVariantDetails = (p.colorVariants || []).map((v: any) => {
        const variantStock = (v.stockInventory || []).reduce((s: number, inv: any) => s + inv.quantity, 0);
        const sizeInventory = (v.stockInventory || []).map((inv: any) => ({
          size: inv.size,
          quantity: inv.quantity,
          isStockOut: inv.isStockOut || inv.quantity === 0,
          isLowStock: inv.quantity > 0 && inv.quantity <= 10,
        }));

        return {
          name: v.name,
          isLowStock: v.isLowStock, // Manual low stock override toggle
          stock: variantStock,
          sizeInventory,
        };
      });

      return {
        id: p.id,
        name: p.name,
        slug: p.slug && p.slug !== 'striped-cotton-shirt' ? p.slug : (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : p.id),
        collectionTag: p.collectionTag || "Minimal",
        categoryId: p.categoryId || undefined,
        categoryName: p.category?.name,
        categorySlug: p.category?.slug,
        priceBdt: p.priceBdt,
        compareAtPriceBdt: p.compareAtPriceBdt || undefined,
        imageUrl: thumb,
        isActive: p.isActive,
        variantsCount: (p.colorVariants || []).length,
        colors: (p.colorVariants || []).map((v: any) => v.name),
        colorVariantDetails,
        totalUnits,
        isLowStock: hasLowStock,
        createdAt: p.createdAt,
        galleryImages: Array.from(new Set([
          thumb,
          ...(p.colorVariants || []).flatMap((v: any) => [
            v.thumbnailUrl,
            ...(v.variantImages || []).map((img: any) => img.imageUrl),
          ]),
        ])).filter(Boolean) as string[],
      };
    });
  } catch (error) {
    console.error('Failed to get admin products:', error);
    return [];
  }
}

export async function getProducts(catSlug?: string): Promise<ProductItem[]> {
  // Storefront only lists active products
  const rows = await getAdminProducts({ status: 'active' });

  let filtered = rows;
  const slug = (catSlug || "").toLowerCase();

  if (slug === "for-him") {
    filtered = rows.filter(
      r => r.categorySlug === "for-him" || (r.collectionTag || "").toLowerCase() === "for-him"
    );
  } else if (slug === "for-her") {
    filtered = rows.filter(
      r => r.categorySlug === "for-her" || (r.collectionTag || "").toLowerCase() === "for-her"
    );
  } else if (slug === "unisex") {
    filtered = rows.filter(
      r => r.categorySlug === "unisex" || (r.collectionTag || "").toLowerCase() === "unisex" || (r.name || "").toLowerCase().includes("unisex")
    );
  } else if (slug === "latest" || slug === "newest") {
    filtered = [...rows].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } else if (slug === "popular") {
    return await getPopularProductsAction(100);
  } else if (slug === "accessories") {
    filtered = rows.filter(
      r => r.categorySlug === "accessories" || (r.collectionTag || "").toLowerCase() === "accessories" || (r.name || "").toLowerCase().includes("accessory")
    );
  } else if (slug) {
    filtered = rows.filter(
      r => r.categorySlug === slug || (r.collectionTag || "").toLowerCase() === slug
    );
  }

  return filtered.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.name,
    priceBdt: r.priceBdt,
    price: String(r.priceBdt),
    imageUrl: r.imageUrl || '/images/for_him.jpg',
    compareAtPriceBdt: r.compareAtPriceBdt,
    collectionTag: r.collectionTag,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categorySlug: r.categorySlug,
    isLowStock: r.isLowStock,
    createdAt: r.createdAt,
    sizes: r.sizes || [],
    galleryImages: r.galleryImages || [],
  }));
}

export async function getPopularProductsAction(limit = 12): Promise<ProductItem[]> {
  const allRows = await getAdminProducts({ status: 'active' });
  const now = Date.now();

  const scored = allRows.map((p) => {
    let points = 10;

    if (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt) {
      const discountPct = (p.compareAtPriceBdt - p.priceBdt) / p.compareAtPriceBdt;
      points += Math.round(discountPct * 30);
    }

    if (p.collectionTag === "Minimal" || p.collectionTag === "Divine") {
      points += 8;
    }

    const createdAtMs = p.createdAt ? new Date(p.createdAt).getTime() : now - 86400000 * 7;
    const daysOld = Math.max(0, (now - createdAtMs) / (1000 * 60 * 60 * 24));
    
    const gravity = 1.5;
    const score = points / Math.pow(daysOld + 2, gravity);

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => ({
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    description: item.product.name,
    priceBdt: item.product.priceBdt,
    price: String(item.product.priceBdt),
    imageUrl: item.product.imageUrl || '/images/for_him.jpg',
    compareAtPriceBdt: item.product.compareAtPriceBdt,
    collectionTag: item.product.collectionTag,
    categoryId: item.product.categoryId,
    categoryName: item.product.categoryName,
    categorySlug: item.product.categorySlug,
    isLowStock: item.product.isLowStock,
    createdAt: item.product.createdAt,
    sizes: item.product.sizes || [],
    galleryImages: item.product.galleryImages || [],
  }));
}

export async function updateFullProductAction(productId: string, inputData: unknown) {
  await requireAdmin();
  if (!productId) return { success: false, message: 'Product ID missing.' };
  const validation = CreateProductSchema.safeParse(inputData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors, message: firstValidationMessage(validation.error) };
  }
  const data = validation.data;

  const existing = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { colorVariants: { with: { variantImages: true, stockInventory: true } } },
  });
  if (!existing) return { success: false, message: 'Product not found.' };
  const clash = await db.query.products.findFirst({ where: eq(products.slug, data.slug), columns: { id: true } });
  if (clash && clash.id !== productId) return { success: false, message: `The URL slug "${data.slug}" is already used by another product.` };

  // Snapshot so we can put things back if anything fails half-way.
  const snapshot = existing;
  try {
    const skus = await assignUniqueSkus(data, productId);
    await db.update(products).set({
      name: data.title,
      slug: data.slug,
      description: data.specifications || data.title,
      collectionTag: data.collectionTag || null,
      categoryId: await resolveCategoryId(data.categoryId),
      priceBdt: Number(data.basePrice),
      compareAtPriceBdt: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      specifications: data.specifications || null,
      isActive: data.isActive,
    }).where(eq(products.id, productId));

    await db.delete(colorVariants).where(eq(colorVariants.productId, productId));
    await insertVariants(productId, data, skus);

    revalidateProductPages(data.slug);
    if (snapshot.slug !== data.slug) revalidatePath(`/product/${snapshot.slug}`);
    return { success: true, message: 'Product updated successfully.' };
  } catch (error) {
    console.error('Failed to update product:', error);
    // Restore the previous version of the product, its colours, images and stock.
    try {
      await db.update(products).set({
        name: snapshot.name, slug: snapshot.slug, description: snapshot.description, collectionTag: snapshot.collectionTag,
        categoryId: snapshot.categoryId, priceBdt: snapshot.priceBdt, compareAtPriceBdt: snapshot.compareAtPriceBdt,
        specifications: snapshot.specifications, isActive: snapshot.isActive,
      }).where(eq(products.id, productId));
      await db.delete(colorVariants).where(eq(colorVariants.productId, productId));
      for (const v of snapshot.colorVariants) {
        await db.insert(colorVariants).values({ id: v.id, productId, name: v.name, hexColor: v.hexColor, thumbnailUrl: v.thumbnailUrl, isLowStock: v.isLowStock, createdAt: v.createdAt });
        if (v.variantImages.length) await db.insert(variantImages).values(v.variantImages);
        if (v.stockInventory.length) await db.insert(stockInventory).values(v.stockInventory);
      }
    } catch (restoreErr) {
      console.error('Failed to restore product after update error:', restoreErr);
    }
    return { success: false, message: 'Could not save the changes. The product was left as it was — please try again.' };
  }
}

type ProductInput = import('zod').infer<typeof CreateProductSchema>;

function firstValidationMessage(error: import('zod').ZodError): string {
  return error.issues[0]?.message || 'Please check the product details.';
}

async function resolveCategoryId(raw?: string | null): Promise<string | null> {
  const catVal = (raw || '').trim();
  if (!catVal) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(catVal);
  const cat = await db.query.categories.findFirst({
    where: isUuid ? eq(categories.id, catVal) : eq(categories.slug, catVal.toLowerCase()),
  });
  return cat?.id ?? null;
}

/** Gives every size row a SKU that is unique across the whole store (SKUs are UNIQUE in the database). */
async function assignUniqueSkus(data: ProductInput, excludeProductId?: string) {
  const rows = await db
    .select({ sku: stockInventory.sku, productId: colorVariants.productId })
    .from(stockInventory)
    .innerJoin(colorVariants, eq(stockInventory.variantId, colorVariants.id));
  const taken = new Set(rows.filter((r) => r.sku && r.productId !== excludeProductId).map((r) => r.sku!.toUpperCase()));
  return data.colorVariants.map((v, vi) =>
    v.inventory.map((inv, ii) => {
      let base = (inv.sku || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (!base || base.length > 40) base = generateCleanSku(data.title, inv.size, vi * 100 + ii).toUpperCase();
      let sku = base;
      for (let n = 2; taken.has(sku); n++) sku = `${base}-${n}`;
      taken.add(sku);
      return sku;
    })
  );
}

async function insertVariants(productId: string, data: ProductInput, skus: string[][]) {
  for (let vi = 0; vi < data.colorVariants.length; vi++) {
    const variant = data.colorVariants[vi];
    const images = variant.images.filter(Boolean);
    const [newVariant] = await db.insert(colorVariants).values({
      productId,
      name: variant.colorName,
      hexColor: variant.hexCode,
      thumbnailUrl: variant.thumbnailUrl || images[0] || '/images/for_him.jpg',
      isLowStock: variant.isLowStock,
    }).returning();

    if (images.length > 0) {
      await db.insert(variantImages).values(images.map((url, index) => ({ variantId: newVariant.id, imageUrl: url, displayOrder: index })));
    }
    if (variant.inventory.length > 0) {
      await db.insert(stockInventory).values(
        variant.inventory.map((inv, ii) => ({
          variantId: newVariant.id,
          size: inv.size,
          sku: skus[vi][ii],
          quantity: inv.quantity,
          isStockOut: inv.quantity === 0,
        }))
      );
    }
  }
}

function revalidateProductPages(slug: string) {
  revalidatePath('/admin/products');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  revalidatePath(`/product/${slug}`);
}

export async function createFullProductAction(inputData: unknown) {
  await requireAdmin();
  const validation = CreateProductSchema.safeParse(inputData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors, message: firstValidationMessage(validation.error) };
  }
  const data = validation.data;

  const clash = await db.query.products.findFirst({ where: eq(products.slug, data.slug), columns: { id: true } });
  if (clash) return { success: false, message: `The URL slug "${data.slug}" is already used by another product.` };

  let newProductId: string | null = null;
  try {
    const skus = await assignUniqueSkus(data);
    const [newProduct] = await db.insert(products).values({
      name: data.title,
      slug: data.slug,
      description: data.specifications || data.title,
      collectionTag: data.collectionTag || null,
      categoryId: await resolveCategoryId(data.categoryId),
      priceBdt: Number(data.basePrice),
      compareAtPriceBdt: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      specifications: data.specifications || null,
      isActive: data.isActive,
    }).returning();
    newProductId = newProduct.id;

    await insertVariants(newProduct.id, data, skus);
    revalidateProductPages(data.slug);
    return { success: true, productId: newProduct.id, message: 'Product created successfully.' };
  } catch (error) {
    console.error('Failed to create product:', error);
    // Undo the partial save so no half-built product appears in the shop (variants/images/stock cascade).
    if (newProductId) await db.delete(products).where(eq(products.id, newProductId)).catch(() => {});
    return { success: false, message: 'Could not save the product. Nothing was saved — please try again.' };
  }
}

export async function createProductAction(formData: FormData | any) {
  await requireAdmin();
  let title = "";
  let slug = "";
  let basePrice = "899";
  let description = "";

  if (formData instanceof FormData) {
    title = formData.get("name")?.toString() || "New Product";
    slug = formData.get("slug")?.toString() || title.toLowerCase().replace(/\s+/g, "-");
    basePrice = formData.get("price")?.toString() || "899";
    description = formData.get("description")?.toString() || title;
  } else {
    title = formData.name || "New Product";
    slug = formData.slug || title.toLowerCase().replace(/\s+/g, "-");
    basePrice = String(formData.priceBdt || formData.price || 899);
    description = formData.description || title;
  }

  return createFullProductAction({
    title,
    slug,
    collectionTag: "Minimal",
    basePrice,
    compareAtPrice: "1199",
    specifications: description,
    isActive: true,
    colorVariants: [
      {
        colorName: "Yellow",
        hexCode: "#E6A100",
        thumbnailUrl: "/images/products/oakwood-yellow-thumb.png",
        isLowStock: false,
        images: ["/images/products/oakwood-yellow-1.png"],
        inventory: [
          { size: "S", sku: `${slug}-S`, quantity: 10, isStockOut: false },
          { size: "M", sku: `${slug}-M`, quantity: 10, isStockOut: false },
          { size: "L", sku: `${slug}-L`, quantity: 10, isStockOut: false },
          { size: "XL", sku: `${slug}-XL`, quantity: 5, isStockOut: false },
          { size: "XXL", sku: `${slug}-XXL`, quantity: 0, isStockOut: true },
        ],
      },
    ],
  });
}

export async function deleteProductAction(productId: string) {
  await requireAdmin();
  if (!db) return { success: false, message: 'Database missing.' };

  try {
    await db.delete(products).where(eq(products.id, productId));
    revalidatePath('/admin/products');
    revalidatePath('/admin');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Product deleted successfully.' };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { success: false, message: 'Failed to delete product.' };
  }
}

export async function bulkUpdateStatusAction(productIds: string[], isActive: boolean) {
  await requireAdmin();
  if (!db || !productIds || productIds.length === 0) {
    return { success: false, message: 'No product IDs provided.' };
  }

  try {
    await db.update(products).set({ isActive }).where(inArray(products.id, productIds));
    revalidatePath('/admin/products');
    revalidatePath('/admin');
    revalidatePath('/', 'layout'); // refresh every storefront page (home, categories, all-products, search…)
    return { success: true, message: `Updated status for ${productIds.length} products.` };
  } catch (error: any) {
    console.error('Failed bulk status update:', error);
    return { success: false, message: 'Failed to update product statuses.' };
  }
}

export async function getAllInventorySkusAction() {
  await requireAdmin();
  try {
    if (db) {
      const invList = await db.query.stockInventory.findMany({
        with: {
          variant: {
            with: {
              product: true,
            },
          },
        },
      });

      if (invList && invList.length > 0) {
        return invList.map((item) => ({
          sku: item.sku || `SKU-${item.id.substring(0, 6)}`,
          size: item.size || 'M',
          quantity: item.quantity || 1,
          variantName: item.variant?.name || 'Primary',
          thumbnailUrl: item.variant?.thumbnailUrl || '/images/products/oakwood-yellow-thumb.png',
          productName: item.variant?.product?.name || 'Apparel Item',
          productId: item.variant?.product?.id || '',
          priceBdt: item.variant?.product?.priceBdt || 1450,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to fetch inventory SKUs:', err);
  }
  return [];
}
