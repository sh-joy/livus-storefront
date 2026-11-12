import Image, { type StaticImageData } from 'next/image';
import { Wind, Activity, Wallet, Truck, Shield, Zap, Award, RefreshCw, Sun, Layers } from 'lucide-react';
import type { AboutLayout, WhyIcon } from '@/lib/about-layout';

// Brand photos already used on the homepage: stand-ins until the owner uploads About photos in admin.
import heroFallback from '@/imports/Homepage/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png';
import sideFallback from '@/imports/Homepage/21edf1b8dee7cef23ed2ec91e1a1b0550b6c38c9.png';
import bandLeftFallback from '@/imports/Homepage/d0bebc10c59b7c075b3c9a8b180df7af46874e97.png';
import bandRightFallback from '@/imports/Homepage/567e4da671b456cb109158110b48b3f597529eca.png';

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

/* Light, large type, the look of the reference page. Overused Grotesk is a variable font, so 300 is real. */
const statement = 'm-0 !font-light text-[clamp(40px,5.2vw,72px)] leading-[1.1] tracking-[-0.03em]';
const pillarTitle = 'm-0 !font-light text-[clamp(32px,3.4vw,50px)] leading-none tracking-[-0.02em]';
const itemTitle = 'm-0 !font-light text-[clamp(24px,2.2vw,30px)] leading-none';
const smallText = 'm-0 text-[15px] leading-[1.55] text-neutral-600';

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
  const { hero, manifesto, pillars, story, why, stats } = layout;
  const pillarItems = pillars.items.filter((p) => p.title).slice(0, 3);
  const whyItems = why.items.filter((w) => w.title).slice(0, 4);
  const statItems = stats.items.filter((s) => s.value && s.label).slice(0, 4);
  const sideImage = pillarItems.find((p) => p.imageUrl)?.imageUrl;

  return (
    <div className="bg-white text-[#0d0d0d]">
      {/* 1 ─ Hero: photo left, big light statement right */}
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
          <div className="flex flex-col justify-center gap-[clamp(28px,3.5vw,48px)] px-[var(--lv-gutter)] lg:px-[clamp(32px,4.5vw,80px)] py-[clamp(48px,7vw,112px)]">
            <h1 className={statement}>{hero.headline}</h1>
            {hero.lead && <p className="m-0 text-[17px] leading-[1.55] text-neutral-600 max-w-[520px]">{hero.lead}</p>}
            {manifesto.enabled && manifesto.text && (
              <p className="m-0 max-w-[600px] text-[clamp(14px,1.15vw,17px)] leading-[1.6] tracking-[0.01em] uppercase text-neutral-800">
                {manifesto.text}
              </p>
            )}
          </div>
        </section>
      ) : (
        <h1 className="sr-only">About LIVUS: Bangladeshi sportswear brand</h1>
      )}

      {/* 2 ─ Pillars stacked and centred on the left, tall photo on the right */}
      {pillars.enabled && pillarItems.length > 0 && (
        <section className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-[clamp(48px,6vw,88px)] px-[var(--lv-gutter)] lg:px-[clamp(32px,5vw,96px)] py-[clamp(64px,8vw,120px)] bg-[#fafafa]">
            {pillarItems.map((p, i) => {
              const Icon = PILLAR_ICONS[i] ?? Activity;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-4 mx-auto max-w-[520px]">
                  <Icon className="size-6 stroke-[1.25]" aria-hidden />
                  <h2 className={pillarTitle}>{p.title}</h2>
                  {p.description && <p className={smallText}>{p.description}</p>}
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

      {/* 3 ─ One big two-tone statement */}
      {story.enabled && story.headline && (
        <section className="px-[var(--lv-gutter)] py-[clamp(72px,10vw,160px)]">
          <div className="max-w-[1120px] lg:pl-[clamp(0px,6vw,120px)]">
            <p className={statement}>
              {story.foundingYear ? `Since ${story.foundingYear}, ` : ''}
              <TwoTone text={story.headline} />
            </p>
            {story.body && <p className={`${smallText} mt-8 max-w-[560px]`}>{story.body}</p>}
          </div>
        </section>
      )}

      {/* 4 ─ Full-width photo band with a white statement, then four benefits */}
      {why.enabled && whyItems.length > 0 && (
        <>
          <section className="relative grid grid-cols-2 h-[clamp(360px,48vw,680px)] overflow-hidden bg-[#0d0d0d]">
            <div className="relative">
              <Image src={pick(story.imageUrl, bandLeftFallback)} alt="" aria-hidden fill sizes="50vw" className="object-cover object-top" />
            </div>
            <div className="relative">
              <Image src={bandRightFallback} alt="" aria-hidden fill sizes="50vw" className="object-cover object-top" />
            </div>
            <div className="absolute inset-0 bg-black/25" aria-hidden />
            {why.heading && (
              <h2 className={`${statement} absolute inset-0 flex items-center justify-center text-center px-[var(--lv-gutter)] !text-white`}>
                <span className="max-w-[760px]">{why.heading}</span>
              </h2>
            )}
          </section>

          <section className="px-[var(--lv-gutter)] py-[clamp(64px,8vw,120px)]">
            <div className="mx-auto max-w-[1000px] grid gap-x-10 gap-y-[clamp(48px,6vw,80px)] sm:grid-cols-2">
              {whyItems.map((w, i) => {
                const Icon = ICONS[w.icon] ?? Wind;
                return (
                  <div key={i} className="flex flex-col items-center text-center gap-4">
                    <Icon className="size-6 stroke-[1.25]" aria-hidden />
                    <h3 className={itemTitle}>{w.title}</h3>
                    {w.description && <p className={`${smallText} max-w-[340px]`}>{w.description}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 5 ─ Numbers: only when the owner has entered real figures */}
      {stats.enabled && statItems.length > 0 && (
        <section className={`grid grid-cols-2 ${statItems.length >= 4 ? 'lg:grid-cols-4' : statItems.length === 3 ? 'lg:grid-cols-3' : ''}`}>
          {statItems.map((s, i) => (
            <div key={i} className="flex flex-col justify-end gap-3 bg-[#0d0d0d] text-white aspect-[3/4] p-[clamp(16px,2vw,28px)] border-r border-white/10 last:border-r-0">
              <span className="!font-light tracking-[-0.04em] leading-none text-[clamp(48px,6vw,96px)]">{s.value}</span>
              <span className="text-[14px] text-white/75">{s.label}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
