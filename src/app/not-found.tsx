import Link from 'next/link';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

export default function NotFound() {
  return (
    <div className="bg-white text-[#0d0d0d] flex flex-col">
      {/* Fills the screen; the slim footer sits below the fold */}
      <div className="min-h-[100dvh] flex flex-col">
        <SiteNav />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-[var(--lv-gutter)] py-16">
          <h1 className="t-h2 m-0">Page not found</h1>
          <p className="t-lead mt-5 mb-9 max-w-[460px]">
            Sorry, we couldn&apos;t find what you were looking for. The link may be broken or the page may have moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/all-products" className="lv-btn lv-btn--solid">Shop all products</Link>
            <Link href="/" className="lv-btn lv-btn--outline">Back to home</Link>
          </div>
        </main>
      </div>
      <SiteFooter compact />
    </div>
  );
}
