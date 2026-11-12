import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { Wind, Activity, Wallet, Truck, Shield, Zap, Award, RefreshCw, Sun, Layers, ArrowRight } from 'lucide-react';
import type { AboutLayout, WhyIcon } from '@/lib/about-layout';

// Brand photos already used on the homepage: stand-ins until the owner uploads About photos in admin.
import heroFallback from '@/imports/Homepage/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png';
import sideFallback from '@/imports/Homepage/21edf1b8dee7cef23ed2ec91e1a1b0550b6c38c9.png';
import menFallback from '@/imports/Homepage/d0bebc10c59b7c075b3c9a8b180df7af46874e97.png';
import womenFallback from '@/imports/Homepage/567e4da671b456cb109158110b48b3f597529eca.png';

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
const PILLAR_ICONS = [Activity, Sun, Layers];

const pick = (url: string | undefined, fallback: StaticImageData): string | StaticImageData => (url ? url : fallback);

/** "First part. Rest" → first part in ink, the rest in grey (two-tone statement). */
function TwoTone({ text }: { text: string }) {
  const m = text.match(/^([^.:]+[.:])\s+([\s\S]+)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      {m[1]} <span className="text-neutral-400">{m[2]}</span>
    </>
  );
}

export function AboutLayoutView({ layout }: { layout: AboutLayout }) {
  const { hero, manifesto, pillars, story, why, stats, cta } = layout;
  const pillarItems = pillars.items.filter((p) => p.title).slice(0, 3);
  const whyItems = why.items.filter((w) => w.title).slice(0, 4);
  const statItems = stats.items.filter((s) => s.value && s.label).slice(0, 4);
  const sideImage = pillarItems.find((p) => p.imageUrl)?.imageUrl;

  return (
    <div className="bg-white text-[#0d0d0d]">
      {/* 1 ─ Hero: photo left, statement right */}
      {hero.enabled ? (
        <section className="grid lg:grid-cols-2">
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
          <div className="flex flex-col justify-center gap-[clamp(24px,3vw,40px)] px-[var(--lv-gutter)] lg:px-[clamp(32px,4.5vw,80px)] py-[clamp(48px,7vw,112px)]">
            <h1 className="t-display m-0">{hero.headline}</h1>
            {hero.lead && <p className="t-lead m-0 max-w-[520px]">{hero.lead}</p>}
            {manifesto.enabled && manifesto.text && (
              <p className="t-small m-0 max-w-[600px] uppercase tracking-[0.06em] text-neutral-700">{manifesto.text}</p>
            )}
          </div>
        </section>
      ) : (
        <h1 className="sr-only">About LIVUS: Bangladeshi sportswear brand</h1>
      )}

      {/* 2 ─ Pillars stacked and centred on the left, tall photo on the right */}
      {pillars.enabled && pillarItems.length > 0 && (
        <section className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-[clamp(48px,6vw,80px)] px-[var(--lv-gutter)] lg:px-[clamp(32px,5vw,96px)] py-[clamp(64px,8vw,120px)] bg-[#fafafa]">
            {pillarItems.map((p, i) => {
              const Icon = PILLAR_ICONS[i] ?? Activity;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-4 mx-auto max-w-[520px]">
                  <Icon className="size-6 stroke-[1.5]" aria-hidden />
                  <h2 className="t-h2 m-0">{p.title}</h2>
                  {p.description && <p className="t-body m-0 text-neutral-600">{p.description}</p>}
                </div>
              );
            })}
          </div>
          <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[760px] bg-[#f0f0f0] overflow-hidden">
            <Image
              src={pick(sideImage, sideFallback)}
              alt="LIVUS sportswear"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover object-top"
            />
          </div>
        </section>
      )}

      {/* 3 ─ One big two-tone statement, centred */}
      {story.enabled && story.headline && (
        <section className="flex flex-col items-center justify-center min-h-[80vh] px-[var(--lv-gutter)] py-[clamp(64px,8vw,120px)]">
          <p className="t-display m-0 mx-auto max-w-[1280px] text-center" style={{ fontSize: 'clamp(34px, 4.6vw, 72px)', lineHeight: 1.08 }}>
            {story.foundingYear ? `Since ${story.foundingYear}, ` : ''}
            <TwoTone text={story.headline} />
          </p>
          {story.body && <p className="t-lead m-0 mt-8 mx-auto max-w-[620px] text-center">{story.body}</p>}
        </section>
      )}

      {/* 4 ─ Four benefits as shaded cards, divided by a thin gap */}
      {why.enabled && whyItems.length > 0 && (
        <section className="px-[var(--lv-gutter)] pb-[clamp(64px,8vw,120px)]">
          {why.heading && <h2 className="t-h2 m-0 mb-[clamp(32px,4vw,56px)] text-center">{why.heading}</h2>}
          <div className="grid gap-2 sm:grid-cols-2">
            {whyItems.map((w, i) => {
              const Icon = ICONS[w.icon] ?? Wind;
              return (
                <div
                  key={i}
                  className="flex flex-col justify-between gap-[clamp(28px,3vw,48px)] bg-[#f4f4f2] p-[clamp(20px,2.4vw,36px)] min-h-[clamp(170px,15vw,220px)]"
                >
                  <Icon className="size-6 stroke-[1.5]" aria-hidden />
                  <div className="flex flex-col gap-3">
                    <h3 className="t-h3 m-0">{w.title}</h3>
                    {w.description && <p className="t-body m-0 text-neutral-600 max-w-[400px]">{w.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5 ─ Numbers: only when the owner has entered real figures */}
      {stats.enabled && statItems.length > 0 && (
        <section className={`grid grid-cols-2 ${statItems.length >= 4 ? 'lg:grid-cols-4' : statItems.length === 3 ? 'lg:grid-cols-3' : ''}`}>
          {statItems.map((s, i) => (
            <div key={i} className="flex flex-col justify-end gap-3 bg-[#0d0d0d] text-white aspect-[3/4] p-[clamp(16px,2vw,28px)] border-r border-white/10 last:border-r-0">
              <span className="t-display !text-white">{s.value}</span>
              <span className="t-small text-white/75">{s.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* 6 ─ Last: two photos; on hover a centred "For Men →" / "For Women →" (always visible on touch screens) */}
      {cta.enabled && cta.heading && (
        <h2 className="t-h2 m-0 text-center px-[var(--lv-gutter)] pt-[clamp(8px,2vw,24px)] pb-[clamp(28px,3.5vw,48px)]">{cta.heading}</h2>
      )}
      {cta.enabled && (
        <section className="grid grid-cols-1 sm:grid-cols-2">
          {[
            { href: cta.buttonMenHref || '/for-him', label: 'For Men', src: menFallback },
            { href: cta.buttonWomenHref || '/for-her', label: 'For Women', src: womenFallback },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              aria-label={c.label}
              className="group relative block aspect-[4/5] sm:aspect-square overflow-hidden bg-[#f0f0f0] no-underline"
            >
              <Image
                src={c.src}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 639px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-black/35 transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 group-focus-visible:opacity-100"
              />
              <span
                className="absolute inset-0 flex items-center justify-center gap-3 text-white transition-all duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 group-focus-visible:opacity-100"
              >
                <span className="t-h2 !text-white">{c.label}</span>
                <ArrowRight className="size-[clamp(24px,2.6vw,36px)] stroke-[1.5]" aria-hidden />
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
