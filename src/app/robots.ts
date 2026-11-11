import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://livus.com.bd';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/checkout',
          '/profile',
          '/verify-email',
          '/signin',
          '/signup',
          '/forgot-password',
          '/variants',
          '/design-system',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
