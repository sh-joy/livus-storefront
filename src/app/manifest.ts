import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LIVUS — Athletic Streetwear & Jerseys',
    short_name: 'LIVUS',
    description:
      'Athletic streetwear and jerseys from Bangladesh. Cash on Delivery, bKash and Nagad accepted.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d0d',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
