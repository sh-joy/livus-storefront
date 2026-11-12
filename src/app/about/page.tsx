import type { Metadata } from 'next';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { InfoPage } from '@/components/storefront/InfoPage';
import { RichText } from '@/components/storefront/RichText';
import { AboutLayoutView } from '@/components/storefront/AboutLayoutView';
import { getSiteContentAction } from '@/app/actions/site-content';
import { mergeAboutLayout } from '@/lib/about-layout';

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mylivus.vercel.app').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: { absolute: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS" },
  description:
    "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
  alternates: { canonical: '/about' },
  openGraph: {
    title: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS",
    description:
      "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
    url: `${siteUrl}/about`,
    siteName: 'LIVUS',
    locale: 'en_BD',
    type: 'website',
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "LIVUS Sportswear Brand" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "LIVUS Sportswear Brand | Bangladeshi Activewear | LIVUS",
    description:
      "Meet the LIVUS sportswear brand: a Bangladeshi sportswear brand making breathable jerseys and training gear for heat and movement. Delivery across Bangladesh.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const [rawLayout, fallbackContent] = await Promise.all([
    getSiteContentAction('about_layout'),
    getSiteContentAction('about_page'),
  ]);

  // If about_layout is configured or has default content, render structured layout
  if (rawLayout && rawLayout.trim()) {
    const layout = mergeAboutLayout(rawLayout);
    return (
      <div className="min-h-screen bg-white text-[#0d0d0d] flex flex-col">
        <SiteNav />
        <main className="flex-1 w-full">
          <AboutLayoutView layout={layout} />
        </main>
        <SiteFooter compact={false} />
      </div>
    );
  }

  // Fallback to RichText InfoPage if about_layout is explicitly empty
  return (
    <InfoPage newsletter title="LIVUS Sportswear Brand">
      <RichText text={fallbackContent} />
    </InfoPage>
  );
}
