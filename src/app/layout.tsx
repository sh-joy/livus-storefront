import { AnalyticsScripts } from '@/components/AnalyticsScripts';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { DrawerProvider } from '@/figma-components/DrawerContext';
import { AppShell } from '@/figma-components/AppShell';
import { cn } from '@/lib/utils';
import { getSiteProfile } from '@/lib/site-profile';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getSiteProfile();

  const shareImg = profile.seo.shareImageUrl || `${siteUrl}/opengraph-image`;
  const favicon = profile.brand.faviconUrl || '/favicon.ico';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: profile.seo.defaultTitle,
      template: profile.seo.titleTemplate,
    },
    description: profile.seo.defaultDescription,
    applicationName: profile.brand.name || 'LIVUS',
    keywords: profile.seo.keywords,
    openGraph: {
      siteName: profile.brand.name || 'LIVUS',
      locale: 'en_BD',
      type: 'website',
      images: [
        {
          url: shareImg,
          width: 1200,
          height: 630,
          alt: profile.seo.defaultTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      creator: profile.seo.twitterHandle || undefined,
      site: profile.seo.twitterHandle || undefined,
      images: [shareImg],
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    verification: {
      google: profile.seo.googleVerification || undefined,
      other: profile.seo.facebookDomainVerification
        ? { 'facebook-domain-verification': profile.seo.facebookDomainVerification }
        : undefined,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getSiteProfile();

  return (
    <html lang="en" suppressHydrationWarning className={cn('h-full antialiased', geistSans.variable, geistMono.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Big+Shoulders:opsz,wght@10..72,100..900&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <OrganizationJsonLd profile={profile} />
        <WebSiteJsonLd profile={profile} />
      </head>
      <body suppressHydrationWarning className="min-h-full w-full flex flex-col bg-white text-slate-950 overflow-x-clip font-sans">
        <DrawerProvider>
          <AppShell>
            {children}
            <AnalyticsScripts />
          </AppShell>
        </DrawerProvider>
      </body>
    </html>
  );
}
