import { z } from 'zod';

export const PillarSchema = z.object({
  title: z.string().trim().default(''),
  description: z.string().trim().default(''),
  imageUrl: z.string().trim().default(''),
});

export const WhyIconEnum = z.enum([
  'wind',
  'activity',
  'wallet',
  'truck',
  'shield',
  'zap',
  'award',
  'refresh-cw',
]);
export type WhyIcon = z.infer<typeof WhyIconEnum>;

export const WhyItemSchema = z.object({
  icon: WhyIconEnum.default('wind'),
  title: z.string().trim().default(''),
  description: z.string().trim().default(''),
});

export const StatItemSchema = z.object({
  value: z.string().trim().default(''),
  label: z.string().trim().default(''),
});

export type Pillar = z.infer<typeof PillarSchema>;
export type WhyItem = z.infer<typeof WhyItemSchema>;
export type StatItem = z.infer<typeof StatItemSchema>;

export const DEFAULT_HERO = {
  enabled: true,
  headline: 'Built for sport. Made for Bangladesh.',
  lead: 'Jerseys, training tops and activewear made for heat, movement and everyday wear.',
  imageUrl: '',
};

export const DEFAULT_MANIFESTO = {
  enabled: true,
  text: 'LIVUS IS FOR EVERYONE WHO TRAINS, PLAYS AND MOVES. WE MAKE SPORTSWEAR FOR BANGLADESH: LIGHT ENOUGH FOR THE HEAT, CUT FOR MOVEMENT, AND SHARP ENOUGH TO WEAR LONG AFTER THE GAME.',
};

export const DEFAULT_PILLARS = {
  enabled: true,
  heading: 'How we build',
  items: [
    {
      title: 'Made to move',
      description: 'Athletic cuts and light fabrics that let you train hard without holding you back.',
      imageUrl: '',
    },
    {
      title: 'Made for here',
      description: 'Breathable pieces designed for Bangladesh heat, humidity and everyday wear.',
      imageUrl: '',
    },
    {
      title: 'Small drops',
      description: 'Limited runs and focused releases, so every piece gets our full attention.',
      imageUrl: '',
    },
  ],
};

export const DEFAULT_STORY = {
  enabled: true,
  headline: 'LIVUS started with a simple idea: sportswear should work as hard as you do, and suit the place you live.',
  body: '',
  imageUrl: '',
  foundingYear: '',
};

export const DEFAULT_WHY = {
  enabled: true,
  heading: 'Sport is better in the right kit.',
  items: [
    {
      icon: 'wind' as WhyIcon,
      title: 'Breathable fabrics',
      description: 'Light, airy fabrics chosen for training in the heat.',
    },
    {
      icon: 'activity' as WhyIcon,
      title: 'Athletic fit',
      description: 'Cuts that move with you, on the pitch and off it.',
    },
    {
      icon: 'wallet' as WhyIcon,
      title: 'Cash on Delivery, bKash & Nagad',
      description: 'Pay when your parcel arrives, or with bKash or Nagad.',
    },
    {
      icon: 'truck' as WhyIcon,
      title: 'Nationwide delivery',
      description: 'Delivered to your door anywhere in Bangladesh.',
    },
  ],
};

export const DEFAULT_STATS = {
  enabled: true,
  heading: '',
  items: [] as StatItem[],
};

export const DEFAULT_CTA = {
  enabled: true,
  heading: 'Ready to train?',
  lead: 'Find your kit for match day, training and everything in between.',
  buttonMenText: "Shop men's sportswear",
  buttonMenHref: '/for-him',
  buttonWomenText: "Shop women's sportswear",
  buttonWomenHref: '/for-her',
};

export const AboutLayoutSchema = z.object({
  hero: z
    .object({
      enabled: z.boolean().default(DEFAULT_HERO.enabled),
      headline: z.string().trim().default(DEFAULT_HERO.headline),
      lead: z.string().trim().default(DEFAULT_HERO.lead),
      imageUrl: z.string().trim().default(DEFAULT_HERO.imageUrl),
    })
    .default(DEFAULT_HERO),

  manifesto: z
    .object({
      enabled: z.boolean().default(DEFAULT_MANIFESTO.enabled),
      text: z.string().trim().default(DEFAULT_MANIFESTO.text),
    })
    .default(DEFAULT_MANIFESTO),

  pillars: z
    .object({
      enabled: z.boolean().default(DEFAULT_PILLARS.enabled),
      heading: z.string().trim().default(DEFAULT_PILLARS.heading),
      items: z.array(PillarSchema).default(DEFAULT_PILLARS.items),
    })
    .default(DEFAULT_PILLARS),

  story: z
    .object({
      enabled: z.boolean().default(DEFAULT_STORY.enabled),
      headline: z.string().trim().default(DEFAULT_STORY.headline),
      body: z.string().trim().default(DEFAULT_STORY.body),
      imageUrl: z.string().trim().default(DEFAULT_STORY.imageUrl),
      foundingYear: z.string().trim().default(DEFAULT_STORY.foundingYear),
    })
    .default(DEFAULT_STORY),

  why: z
    .object({
      enabled: z.boolean().default(DEFAULT_WHY.enabled),
      heading: z.string().trim().default(DEFAULT_WHY.heading),
      items: z.array(WhyItemSchema).default(DEFAULT_WHY.items),
    })
    .default(DEFAULT_WHY),

  stats: z
    .object({
      enabled: z.boolean().default(DEFAULT_STATS.enabled),
      heading: z.string().trim().default(DEFAULT_STATS.heading),
      items: z.array(StatItemSchema).default(DEFAULT_STATS.items),
    })
    .default(DEFAULT_STATS),

  cta: z
    .object({
      enabled: z.boolean().default(DEFAULT_CTA.enabled),
      heading: z.string().trim().default(DEFAULT_CTA.heading),
      lead: z.string().trim().default(DEFAULT_CTA.lead),
      buttonMenText: z.string().trim().default(DEFAULT_CTA.buttonMenText),
      buttonMenHref: z.string().trim().default(DEFAULT_CTA.buttonMenHref),
      buttonWomenText: z.string().trim().default(DEFAULT_CTA.buttonWomenText),
      buttonWomenHref: z.string().trim().default(DEFAULT_CTA.buttonWomenHref),
    })
    .default(DEFAULT_CTA),
});

export type AboutLayout = z.infer<typeof AboutLayoutSchema>;

export const DEFAULT_ABOUT_LAYOUT: AboutLayout = AboutLayoutSchema.parse({});

/**
 * Merge partial or stored JSON with base schema defaults.
 */
export function mergeAboutLayout(rawJson?: unknown): AboutLayout {
  let raw: any = {};
  if (rawJson && typeof rawJson === 'object') {
    raw = rawJson;
  } else if (typeof rawJson === 'string' && rawJson.trim()) {
    try {
      raw = JSON.parse(rawJson);
    } catch {
      raw = {};
    }
  }

  const merged = {
    hero: { ...DEFAULT_HERO, ...(raw.hero || {}) },
    manifesto: { ...DEFAULT_MANIFESTO, ...(raw.manifesto || {}) },
    pillars: {
      ...DEFAULT_PILLARS,
      ...(raw.pillars || {}),
      items:
        Array.isArray(raw.pillars?.items) && raw.pillars.items.length > 0
          ? raw.pillars.items
          : DEFAULT_PILLARS.items,
    },
    story: { ...DEFAULT_STORY, ...(raw.story || {}) },
    why: {
      ...DEFAULT_WHY,
      ...(raw.why || {}),
      items:
        Array.isArray(raw.why?.items) && raw.why.items.length > 0
          ? raw.why.items
          : DEFAULT_WHY.items,
    },
    stats: {
      ...DEFAULT_STATS,
      ...(raw.stats || {}),
      items: Array.isArray(raw.stats?.items) ? raw.stats.items : DEFAULT_STATS.items,
    },
    cta: { ...DEFAULT_CTA, ...(raw.cta || {}) },
  };

  const result = AboutLayoutSchema.safeParse(merged);
  return result.success ? result.data : AboutLayoutSchema.parse({});
}
