import type { MetadataRoute } from 'next';
import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

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
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? ('daily' as const) : ('weekly' as const),
    priority: route === '' ? 1.0 : route.startsWith('/for-') ? 0.9 : 0.7,
  }));

  try {
    if (db) {
      const [activeProducts, allCategories] = await Promise.all([
        db.query.products.findMany({
          where: eq(products.isActive, true),
        }),
        db.query.categories.findMany(),
      ]);

      const productRoutes: MetadataRoute.Sitemap = activeProducts.map((p) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: p.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }));

      const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((c) => ({
        url: `${baseUrl}/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      // Deduplicate routes
      const seen = new Set<string>();
      const combined = [...staticRoutes, ...categoryRoutes, ...productRoutes];
      return combined.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    }
  } catch (err) {
    console.warn('Sitemap generation product lookup fallback:', err);
  }

  return staticRoutes;
}
