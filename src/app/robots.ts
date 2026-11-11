import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/checkout',
          '/profile',
          '/order-confirmed',
          '/verify-email',
          '/forgot-password',
          '/variants',
          '/design-system',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
