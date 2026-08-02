import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "LIVUS — Custom Athletic Streetwear & Teamwear Atelier",
  description: "Bangladesh's premier athletic streetwear brand. Design and print your own custom kit built for high performance.",
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
          </AppShell>
        </DrawerProvider>
      </body>
    </html>
  );
}
