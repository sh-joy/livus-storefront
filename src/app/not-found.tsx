import Link from 'next/link';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <SiteNav />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-mono mb-2">404 — Page Not Found</p>
        <h1 className="text-5xl font-display uppercase tracking-tight mb-4">Nothing to See Here</h1>
        <p className="text-sm text-neutral-600 max-w-md mb-8">
          The garment or page you are looking for has been moved, archived, or does not exist.
        </p>
        <Link
          href="/all-products"
          className="bg-black text-white px-8 py-3.5 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          Explore All Apparel
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
