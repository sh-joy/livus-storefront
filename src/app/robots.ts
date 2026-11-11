import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/checkout',
          '/checkout/*',
          '/profile',
          '/profile/*',
          '/order-confirmed',
          '/order-confirmed/*',
          '/signin',
          '/signup',
          '/verify-email',
          '/forgot-password',
          '/search',
          '/search/*',
          '/variants',
          '/design-system',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
