import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/all-products',
    '/for-him',
    '/for-her',
    '/accessories',
    '/unisex',
    '/latest',
    '/popular',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/shipping-returns',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    if (db) {
      const activeProducts = await db.query.products.findMany({
        where: eq(products.isActive, true),
      });

      const productRoutes: MetadataRoute.Sitemap = activeProducts.map((p) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: p.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));

      return [...staticRoutes, ...productRoutes];
    }
  } catch (err) {
    console.warn('Sitemap generation product lookup fallback:', err);
  }

  return staticRoutes;
}
