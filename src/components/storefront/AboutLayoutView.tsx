import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { Wind, Activity, Wallet, Truck, Shield, Zap, Award, RefreshCw, ArrowRight } from 'lucide-react';
import type { AboutLayout, WhyIcon } from '@/lib/about-layout';
import { RichText } from '@/components/storefront/RichText';

// Brand photos already used on the homepage: stand-ins until the owner uploads About photos in admin.
import heroFallback from '@/imports/Homepage/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png';
import storyFallback from '@/imports/Homepage/21edf1b8dee7cef23ed2ec91e1a1b0550b6c38c9.png';
import himFallback from '@/imports/Homepage/d0bebc10c59b7c075b3c9a8b180df7af46874e97.png';
import herFallback from '@/imports/Homepage/567e4da671b456cb109158110b48b3f597529eca.png';

const ICONS: Record<WhyIcon, typeof Wind> = {
  wind: Wind,
  activity: Activity,
  wallet: Wallet,
  truck: Truck,
  shield: Shield,
  zap: Zap,
  award: Award,
  'refresh-cw': RefreshCw,
};

const pick = (url: string, fallback: StaticImageData): string | StaticImageData => (url ? url : fallback);

/** Section label used across the page: small uppercase eyebrow with a short rule. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-eyebrow m-0 flex items-center gap-3 text-neutral-500">
      <span aria-hidden className="inline-block h-px w-8 bg-neutral-400" />
      {children}
    </p>
  );
}

export function AboutLayoutView({ layout }: { layout: AboutLayout }) {
  const { hero, manifesto, pillars, story, why, stats, cta } = layout;
  const pillarItems = pillars.items.filter((p) => p.title);
  const whyItems = why.items.filter((w) => w.title);
  const statItems = stats.items.filter((s) => s.value && s.label);

  return (
    <div className="bg-white text-[#0d0d0d]">
      {/* 1 ─ Hero: tall photo + big statement, with the manifesto underneath */}
      {hero.enabled ? (
        <section className="grid lg:grid-cols-2 border-b border-[var(--lv-line)]">
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[calc(100svh-96px)] bg-[#f0f0f0] overflow-hidden">
            <Image
              src={pick(hero.imageUrl, heroFallback)}
              alt="LIVUS sportswear"
              fill
              preload
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
          <div className="flex flex-col justify-center gap-[clamp(24px,3vw,40px)] px-[var(--lv-gutter)] lg:px-[clamp(32px,5vw,88px)] py-[clamp(40px,7vw,112px)]">
            <Eyebrow>About LIVUS</Eyebrow>
            <h1 className="t-display m-0" style={{ fontSize: 'clamp(44px, 6.2vw, 104px)', lineHeight: 0.92 }}>
              {hero.headline}
            </h1>
            {hero.lead && <p className="t-lead m-0 max-w-[520px]">{hero.lead}</p>}
            {manifesto.enabled && manifesto.text && (
              <p className="m-0 max-w-[560px] text-[13px] leading-[1.75] tracking-[0.08em] uppercase text-neutral-600 border-t border-[var(--lv-line)] pt-[clamp(20px,2.4vw,32px)]">
                {manifesto.text}
              </p>
            )}
          </div>
        </section>
      ) : (
        <h1 className="sr-only">About LIVUS: Bangladeshi sportswear brand</h1>
      )}

      {/* Manifesto on its own when the hero is hidden */}
      {!hero.enabled && manifesto.enabled && manifesto.text && (
        <section className="px-[var(--lv-gutter)] py-[clamp(56px,8vw,120px)] border-b border-[var(--lv-line)]">
          <p className="m-0 mx-auto max-w-[880px] text-center text-[clamp(15px,1.4vw,19px)] leading-[1.7] tracking-[0.08em] uppercase">
            {manifesto.text}
          </p>
        </section>
      )}

      {/* 2 ─ Pillars: numbered columns, no boxes */}
      {pillars.enabled && pillarItems.length > 0 && (
        <section className="px-[var(--lv-gutter)] py-[clamp(56px,8vw,120px)]">
          <div className="flex flex-col gap-4 mb-[clamp(32px,4vw,56px)]">
            <Eyebrow>Our approach</Eyebrow>
            {pillars.heading && <h2 className="t-h2 m-0">{pillars.heading}</h2>}
          </div>
          <div className="grid gap-x-[clamp(20px,3vw,48px)] gap-y-12 md:grid-cols-3">
            {pillarItems.map((p, i) => (
              <article key={i} className="flex flex-col gap-4">
                {p.imageUrl && (
                  <div className="relative aspect-[4/5] bg-[#f0f0f0] overflow-hidden mb-2">
                    <Image src={p.imageUrl} alt={p.title} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="border-t border-[#0d0d0d] pt-4 flex items-baseline justify-between gap-4">
                  <h3 className="t-h3 m-0">{p.title}</h3>
                  <span className="t-small text-neutral-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </div>
                {p.description && <p className="t-body m-0 text-neutral-600 max-w-[420px]">{p.description}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 3 ─ Story: text panel + photo (mirror of the hero) */}
      {story.enabled && (story.headline || story.body) && (
        <section className="grid lg:grid-cols-2">
          <div className="order-2 lg:order-1 flex flex-col justify-center gap-[clamp(20px,2.4vw,32px)] bg-[#f4f4f2] px-[var(--lv-gutter)] lg:px-[clamp(32px,5vw,88px)] py-[clamp(48px,7vw,112px)]">
            <Eyebrow>{story.foundingYear ? `Our story · Since ${story.foundingYear}` : 'Our story'}</Eyebrow>
            {story.headline && (
              <h2 className="t-h2 m-0 max-w-[640px]" style={{ fontSize: 'clamp(32px, 4.2vw, 64px)' }}>
                {story.headline}
              </h2>
            )}
            {story.body && (
              <div className="t-body text-neutral-700 max-w-[560px] lv-prose">
                <RichText text={story.body} />
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2 relative aspect-[4/5] lg:aspect-auto lg:min-h-[640px] bg-[#f0f0f0] overflow-hidden">
            <Image
              src={pick(story.imageUrl, storyFallback)}
              alt="LIVUS sportswear in use"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
        </section>
      )}

      {/* 4 ─ Why LIVUS: open row divided by hairlines */}
      {why.enabled && whyItems.length > 0 && (
        <section className="px-[var(--lv-gutter)] py-[clamp(56px,8vw,120px)]">
          <div className="flex flex-col gap-4 mb-[clamp(32px,4vw,56px)]">
            <Eyebrow>What you get</Eyebrow>
            {why.heading && <h2 className="t-h2 m-0">{why.heading}</h2>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[#0d0d0d]">
            {whyItems.map((w, i) => {
              const Icon = ICONS[w.icon] ?? Wind;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-3 py-8 border-b border-[var(--lv-line)] lg:border-b-0 ${
                    i > 0 ? 'lg:border-l lg:pl-6' : ''
                  } ${i % 2 === 1 ? 'sm:pl-6 sm:border-l lg:pl-6' : ''} lg:pr-6`}
                >
                  <Icon className="size-6 stroke-[1.5]" aria-hidden />
                  <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em]">{w.title}</h3>
                  {w.description && <p className="t-small m-0 text-neutral-600 max-w-[300px]">{w.description}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5 ─ Numbers: only when the owner has entered real figures */}
      {stats.enabled && statItems.length > 0 && (
        <section className="bg-[#0d0d0d] text-white px-[var(--lv-gutter)] py-[clamp(56px,7vw,104px)]">
          {stats.heading && <h2 className="t-h2 m-0 mb-10 !text-white">{stats.heading}</h2>}
          <div className={`grid gap-10 grid-cols-2 ${statItems.length >= 4 ? 'lg:grid-cols-4' : statItems.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {statItems.map((s, i) => (
              <div key={i} className="flex flex-col gap-2 border-t border-white/25 pt-5">
                <span className="font-semibold tracking-[-0.05em] leading-none" style={{ fontSize: 'clamp(44px, 5.5vw, 88px)' }}>
                  {s.value}
                </span>
                <span className="t-eyebrow text-white/70">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6 ─ Close: two big shop panels, same language as the homepage */}
      {cta.enabled && (
        <section className="px-[var(--lv-gutter)] pb-[clamp(56px,8vw,120px)] pt-[clamp(8px,2vw,24px)]">
          {(cta.heading || cta.lead) && (
            <div className="flex flex-col gap-3 mb-[clamp(24px,3vw,40px)] md:flex-row md:items-end md:justify-between md:gap-10">
              {cta.heading && <h2 className="t-h2 m-0">{cta.heading}</h2>}
              {cta.lead && <p className="t-lead m-0 max-w-[440px]">{cta.lead}</p>}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: cta.buttonMenHref || '/for-him', label: cta.buttonMenText || "Shop men's sportswear", line: 'For Him', src: himFallback },
              { href: cta.buttonWomenHref || '/for-her', label: cta.buttonWomenText || "Shop women's sportswear", line: 'For Her', src: herFallback },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="group relative block aspect-[4/5] sm:aspect-square overflow-hidden bg-[#f0f0f0] no-underline">
                <Image src={c.src} alt="" aria-hidden fill sizes="(max-width: 639px) 100vw, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                <div className="absolute inset-0 flex flex-col justify-between p-[clamp(16px,2.4vw,32px)]">
                  <span className="t-display" style={{ fontSize: 'clamp(48px, 6vw, 96px)', lineHeight: 0.85 }}>
                    {c.line}
                  </span>
                  <span className="lv-btn lv-btn--light self-end !px-5 group-hover:!bg-[#0d0d0d] group-hover:!text-white group-hover:!border-[#0d0d0d]">
                    {c.label}
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
