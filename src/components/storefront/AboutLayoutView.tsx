import Image from 'next/image';
import Link from 'next/link';
import {
  Wind,
  Activity,
  Wallet,
  Truck,
  Shield,
  Zap,
  Award,
  RefreshCw,
} from 'lucide-react';
import type { AboutLayout, WhyIcon } from '@/lib/about-layout';
import { RichText } from '@/components/storefront/RichText';

function renderWhyIcon(name: WhyIcon) {
  const props = { className: 'size-6 stroke-[1.5] text-[#0d0d0d]', 'aria-hidden': true };
  switch (name) {
    case 'activity':
      return <Activity {...props} />;
    case 'wallet':
      return <Wallet {...props} />;
    case 'truck':
      return <Truck {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'award':
      return <Award {...props} />;
    case 'refresh-cw':
      return <RefreshCw {...props} />;
    case 'wind':
    default:
      return <Wind {...props} />;
  }
}

export function AboutLayoutView({ layout }: { layout: AboutLayout }) {
  const { hero, manifesto, pillars, story, why, stats, cta } = layout;

  // Filter stats: only render if at least one stat has non-empty value and label
  const validStats = (stats.items || []).filter(
    (s) => s.value?.trim() !== '' && s.label?.trim() !== ''
  );
  const showStats = stats.enabled && validStats.length > 0;

  // Filter pillars: at least title or description
  const validPillars = (pillars.items || []).filter(
    (p) => p.title?.trim() !== '' || p.description?.trim() !== ''
  );
  const showPillars = pillars.enabled && validPillars.length > 0;

  // Filter why items: at least title or description
  const validWhy = (why.items || []).filter(
    (w) => w.title?.trim() !== '' || w.description?.trim() !== ''
  );
  const showWhy = why.enabled && validWhy.length > 0;

  const hasSportswearKeyword =
    hero.headline.toLowerCase().includes('sportswear') ||
    hero.lead.toLowerCase().includes('sportswear');

  return (
    <div className="w-full bg-white text-[#0d0d0d] flex flex-col">
      {/* 1. HERO STATEMENT */}
      {hero.enabled && (
        <section
          aria-label="About LIVUS Hero"
          className={`w-full border-b border-[var(--lv-line)] ${
            !hero.imageUrl ? 'bg-[#0d0d0d] text-white' : 'bg-white text-[#0d0d0d]'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-[var(--lv-gutter)] py-[clamp(48px,8vw,96px)]">
            <div
              className={`grid gap-8 items-center ${
                hero.imageUrl ? 'grid-cols-1 lg:grid-cols-12 lg:gap-12' : 'grid-cols-1'
              }`}
            >
              <div className={hero.imageUrl ? 'lg:col-span-7 flex flex-col gap-4' : 'max-w-[900px] flex flex-col gap-4'}>
                <span className={`t-eyebrow uppercase tracking-[0.14em] ${!hero.imageUrl ? 'text-neutral-400' : 'text-[#666]'}`}>
                  LIVUS Sportswear Brand
                </span>
                <h1 className="t-display m-0 leading-[1.04] tracking-[-0.03em] uppercase">
                  {hero.headline}
                  {!hasSportswearKeyword && (
                    <span className="sr-only"> — LIVUS Bangladeshi Sportswear Brand</span>
                  )}
                </h1>
                {hero.lead && (
                  <p
                    className={`t-lead m-0 max-w-[680px] leading-relaxed pt-2 ${
                      !hero.imageUrl ? 'text-neutral-300' : 'text-[#4a4a4a]'
                    }`}
                  >
                    {hero.lead}
                  </p>
                )}
              </div>

              {hero.imageUrl && (
                <div className="lg:col-span-5 relative w-full aspect-[4/3] lg:aspect-[1/1] overflow-hidden bg-neutral-100 border border-[var(--lv-line)]">
                  <Image
                    src={hero.imageUrl}
                    alt="LIVUS sportswear training on the pitch"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. MANIFESTO */}
      {manifesto.enabled && manifesto.text?.trim() && (
        <section
          aria-label="Brand Manifesto"
          className="w-full border-b border-[var(--lv-line)] bg-neutral-50/50 py-[clamp(44px,7vw,88px)] px-[var(--lv-gutter)]"
        >
          <div className="max-w-[880px] mx-auto text-center flex flex-col items-center gap-3">
            <span className="t-eyebrow uppercase text-[#8a8a8a] tracking-[0.2em]">Our Manifesto</span>
            <p className="t-eyebrow text-[#0d0d0d] tracking-[0.14em] leading-[1.8] uppercase text-[15px] sm:text-[17px] m-0 font-medium">
              {manifesto.text}
            </p>
          </div>
        </section>
      )}

      {/* 3. THREE PILLARS */}
      {showPillars && (
        <section
          aria-label="Core Pillars"
          className="w-full border-b border-[var(--lv-line)] py-[clamp(48px,7vw,88px)] px-[var(--lv-gutter)]"
        >
          <div className="max-w-[1440px] mx-auto flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-2">
              <span className="t-eyebrow uppercase text-[#8a8a8a] tracking-[0.14em]">Our Approach</span>
              <h2 className="t-h2 m-0 uppercase tracking-[-0.02em]">{pillars.heading}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {validPillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="flex flex-col border border-[var(--lv-line)] bg-white p-6 sm:p-7 gap-4"
                >
                  {pillar.imageUrl ? (
                    <div className="relative w-full aspect-[4/5] bg-neutral-100 overflow-hidden border border-[var(--lv-line)] mb-2">
                      <Image
                        src={pillar.imageUrl}
                        alt={pillar.title || 'LIVUS sportswear pillar'}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <span className="t-eyebrow text-neutral-400 font-mono text-xs">0{idx + 1}</span>
                    <h3 className="t-h3 m-0 uppercase tracking-[-0.01em]">{pillar.title}</h3>
                    <p className="t-body m-0 text-[#4a4a4a] leading-relaxed line-clamp-3">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. STORY BLOCK */}
      {story.enabled && (story.headline?.trim() || story.body?.trim()) && (
        <section
          aria-label="Our Story"
          className="w-full border-b border-[var(--lv-line)] py-[clamp(48px,8vw,96px)] px-[var(--lv-gutter)] bg-white"
        >
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {story.imageUrl && (
              <div className="lg:col-span-6 relative w-full aspect-[4/3] sm:aspect-[16/11] bg-neutral-100 overflow-hidden border border-[var(--lv-line)] order-2 lg:order-1">
                <Image
                  src={story.imageUrl}
                  alt={story.headline || 'LIVUS brand story'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div
              className={`flex flex-col gap-5 order-1 lg:order-2 ${
                story.imageUrl ? 'lg:col-span-6' : 'lg:col-span-10 max-w-[840px]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="t-eyebrow uppercase text-[#8a8a8a] tracking-[0.14em]">Our Story</span>
                {story.foundingYear?.trim() ? (
                  <span className="t-small text-[12px] font-mono px-2 py-0.5 border border-[var(--lv-line)] bg-neutral-50 uppercase text-[#4a4a4a]">
                    {story.foundingYear.trim()}
                  </span>
                ) : null}
              </div>

              {story.headline && (
                <h2 className="t-h2 m-0 uppercase tracking-[-0.02em] leading-tight">
                  {story.headline}
                </h2>
              )}

              {story.body && (
                <div className="t-body text-[#4a4a4a] leading-relaxed space-y-4">
                  <RichText text={story.body} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. WHY LIVUS */}
      {showWhy && (
        <section
          aria-label="Why Choose LIVUS"
          className="w-full border-b border-[var(--lv-line)] py-[clamp(44px,7vw,80px)] px-[var(--lv-gutter)] bg-neutral-50/40"
        >
          <div className="max-w-[1440px] mx-auto flex flex-col gap-8 md:gap-10">
            <div className="flex flex-col gap-1.5">
              <span className="t-eyebrow uppercase text-[#8a8a8a] tracking-[0.14em]">Commitment</span>
              <h2 className="t-h2 m-0 uppercase tracking-[-0.02em]">{why.heading}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {validWhy.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-6 bg-white border border-[var(--lv-line)] gap-3.5"
                >
                  <div className="size-11 flex items-center justify-center bg-neutral-100 border border-[var(--lv-line)] shrink-0">
                    {renderWhyIcon(item.icon)}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="t-h3 text-[17px] m-0 uppercase tracking-[-0.01em] font-medium">
                      {item.title}
                    </h3>
                    <p className="t-body text-[14px] m-0 text-[#555] leading-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. NUMBERS / STATS ROW (HIDDEN unless real numbers entered by owner) */}
      {showStats && (
        <section
          aria-label="Key Numbers"
          className="w-full border-b border-[var(--lv-line)] py-[clamp(36px,6vw,72px)] px-[var(--lv-gutter)] bg-black text-white"
        >
          <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
            {stats.heading?.trim() && (
              <span className="t-eyebrow uppercase text-neutral-400 tracking-[0.14em]">
                {stats.heading}
              </span>
            )}
            <div
              className={`grid gap-6 ${
                validStats.length === 1
                  ? 'grid-cols-1'
                  : validStats.length === 2
                  ? 'grid-cols-2'
                  : validStats.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {validStats.map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-1 border-l border-neutral-800 pl-5">
                  <span className="t-display text-[clamp(32px,5vw,56px)] leading-none font-bold uppercase tracking-tight">
                    {stat.value}
                  </span>
                  <span className="t-eyebrow uppercase text-neutral-400 text-xs tracking-[0.12em] pt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. CTA ROW */}
      {cta.enabled && (
        <section
          aria-label="Call to Action"
          className="w-full py-[clamp(56px,8vw,96px)] px-[var(--lv-gutter)] bg-white text-center"
        >
          <div className="max-w-[760px] mx-auto flex flex-col items-center gap-4">
            <span className="t-eyebrow uppercase text-[#8a8a8a] tracking-[0.14em]">The Pitch Awaits</span>
            <h2 className="t-h2 m-0 uppercase tracking-[-0.02em]">{cta.heading}</h2>
            {cta.lead && (
              <p className="t-lead m-0 text-[#4a4a4a] max-w-[620px] leading-relaxed pb-2">
                {cta.lead}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-2">
              <Link
                href={cta.buttonMenHref || '/for-him'}
                className="lv-btn lv-btn--solid w-full sm:w-auto sm:min-w-[220px] text-center"
              >
                {cta.buttonMenText || "Shop men's sportswear"}
              </Link>
              <Link
                href={cta.buttonWomenHref || '/for-her'}
                className="lv-btn lv-btn--outline w-full sm:w-auto sm:min-w-[220px] text-center"
              >
                {cta.buttonWomenText || "Shop women's sportswear"}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
