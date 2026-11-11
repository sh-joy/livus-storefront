import { AnalyticsScripts } from '@/components/AnalyticsScripts';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { DrawerProvider } from "@/figma-components/DrawerContext";
import { AppShell } from "@/figma-components/AppShell";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const defaultTitle = "LIVUS — Athletic Streetwear & Jerseys | Bangladesh";
const defaultDescription =
  "Shop LIVUS athletic streetwear, jerseys and accessories for him and her. Nationwide delivery across Bangladesh with Cash on Delivery, bKash and Nagad.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | LIVUS",
  },
  description: defaultDescription,
  applicationName: "LIVUS",
  keywords: [
    "LIVUS",
    "athletic streetwear",
    "jerseys Bangladesh",
    "sportswear Bangladesh",
    "streetwear Dhaka",
    "activewear",
    "t-shirts",
    "Cash on Delivery",
    "bKash",
    "Nagad",
  ],
  // og:title / og:description inherit from each route's title and description;
  // the default og:image comes from src/app/opengraph-image.tsx.
  openGraph: {
    siteName: "LIVUS",
    locale: "en_BD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased", geistSans.variable, geistMono.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Barlow+Semi+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Big+Shoulders:opsz,wght@10..72,100..900&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
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
