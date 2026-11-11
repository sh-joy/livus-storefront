import type { ReactNode } from 'react';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';

/** Helper to extract leading "Last updated: <date>" line from policy text */
export function extractLastUpdated(text: string): { date?: string; cleanText: string } {
  if (!text) return { cleanText: text };
  const match = text.match(/^\s*(Last updated:[^\n]+)\n*/i);
  if (match) {
    return {
      date: match[1].trim(),
      cleanText: text.slice(match[0].length).trimStart(),
    };
  }
  return { cleanText: text };
}

/** Shared layout for About, Contact, Privacy, Terms, Shipping & Returns. */
/** `newsletter` shows the footer newsletter block (About only); policy and help pages use the slim footer. */
export function InfoPage({
  title,
  date,
  intro,
  newsletter = false,
  children,
}: {
  title: string;
  date?: string;
  intro?: ReactNode;
  newsletter?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#0d0d0d] flex flex-col">
      <SiteNav />
      <main className="flex-1 w-full px-[var(--lv-gutter)] pt-[clamp(20px,3vw,44px)]">
        <div className="mx-auto w-full max-w-[760px]">
          <h1 className="t-h2 m-0">{title}</h1>
          {date && (
            <p className="text-[15px] text-[#555555] mt-2.5 mb-0 font-normal">
              {date}
            </p>
          )}
          {intro && <div className="t-lead mt-3 max-w-[620px]">{intro}</div>}
          <div className="lv-prose mt-[clamp(14px,1.8vw,20px)] pt-[clamp(14px,1.8vw,20px)] border-t border-[var(--lv-line)]">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter compact={!newsletter} />
    </div>
  );
}
