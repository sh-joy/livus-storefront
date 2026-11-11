import { escapeJsonLd } from '@/lib/seo';
import type { SiteProfile } from '@/lib/site-profile';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export function OrganizationJsonLd({ profile }: { profile: SiteProfile }) {
  const sameAs = [
    profile.social.facebook,
    profile.social.instagram,
    profile.social.tiktok,
    profile.social.youtube,
    profile.social.x,
    profile.social.linkedin,
  ].filter(Boolean);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: profile.brand.name || 'LIVUS',
    url: siteUrl,
    logo: profile.brand.logoUrl || `${siteUrl}/favicon.ico`,
    sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: profile.contact.phones[0] || undefined,
        contactType: 'customer service',
        email: profile.contact.email || undefined,
        areaServed: 'BD',
        availableLanguage: ['English', 'Bengali'],
      },
    ],
    address: profile.contact.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: profile.contact.address,
          addressCountry: 'BD',
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(schema) }}
    />
  );
}

export function WebSiteJsonLd({ profile }: { profile: SiteProfile }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profile.brand.name || 'LIVUS',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(schema) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(schema) }}
    />
  );
}
