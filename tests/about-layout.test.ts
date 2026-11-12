import { describe, it, expect } from 'vitest';
import {
  AboutLayoutSchema,
  DEFAULT_ABOUT_LAYOUT,
  mergeAboutLayout,
} from '@/lib/about-layout';
import { SITE_CONTENT_KEYS, DEFAULT_CONTENT } from '@/content/site-content-defaults';

describe('About Page Redesign & Layout Model (Agent A)', () => {
  it('parses valid defaults adhering to sportswear brand voice with no fake stats or founding year', () => {
    const layout = AboutLayoutSchema.parse({});

    // Hero
    expect(layout.hero.enabled).toBe(true);
    expect(layout.hero.headline).toBe('Built for sport. Made for Bangladesh.');
    expect(layout.hero.lead).toContain('Jerseys, training tops and activewear');

    // Manifesto
    expect(layout.manifesto.enabled).toBe(true);
    expect(layout.manifesto.text).toContain('LIVUS IS FOR EVERY ATHLETE');

    // 3 Pillars
    expect(layout.pillars.enabled).toBe(true);
    expect(layout.pillars.items).toHaveLength(3);
    expect(layout.pillars.items[0].title).toBe('Made to move');
    expect(layout.pillars.items[1].title).toBe('Made for here');
    expect(layout.pillars.items[2].title).toBe('Small drops');

    // Story
    expect(layout.story.enabled).toBe(true);
    expect(layout.story.headline).toContain('Rooted in Dhaka');
    // Golden rule: founding year must NEVER have a placeholder or invented year
    expect(layout.story.foundingYear).toBe('');

    // Why LIVUS (4 items, no offers)
    expect(layout.why.enabled).toBe(true);
    expect(layout.why.items).toHaveLength(4);
    expect(layout.why.items[0].title).toBe('Breathable fabrics');
    expect(layout.why.items[1].title).toBe('Athletic fit');
    expect(layout.why.items[2].title).toBe('Cash on Delivery, bKash & Nagad');
    expect(layout.why.items[3].title).toBe('Nationwide delivery');

    // No offers or "free" anywhere in Why items
    for (const item of layout.why.items) {
      expect(item.title.toLowerCase()).not.toContain('free');
      expect(item.description.toLowerCase()).not.toContain('free');
    }

    // Stats: Golden rule: hidden entirely by default with zero fake numbers
    expect(layout.stats.items).toHaveLength(0);

    // CTA
    expect(layout.cta.enabled).toBe(true);
    expect(layout.cta.buttonMenHref).toBe('/for-him');
    expect(layout.cta.buttonWomenHref).toBe('/for-her');
  });

  it('mergeAboutLayout handles null, undefined, empty string, and malformed inputs gracefully', () => {
    const fromNull = mergeAboutLayout(null);
    expect(fromNull.hero.headline).toBe(DEFAULT_ABOUT_LAYOUT.hero.headline);

    const fromEmpty = mergeAboutLayout('');
    expect(fromEmpty.pillars.items).toHaveLength(3);

    const fromMalformed = mergeAboutLayout('{ broken json ...');
    expect(fromMalformed.story.headline).toBe(DEFAULT_ABOUT_LAYOUT.story.headline);
  });

  it('mergeAboutLayout deep merges partial updates without wiping other sections', () => {
    const partial = {
      hero: {
        headline: 'Engineered for Champions.',
        imageUrl: 'https://blob.vercel-storage.com/hero.jpg',
      },
      story: {
        foundingYear: 'Est. 2024',
      },
    };

    const merged = mergeAboutLayout(partial);
    expect(merged.hero.headline).toBe('Engineered for Champions.');
    expect(merged.hero.imageUrl).toBe('https://blob.vercel-storage.com/hero.jpg');
    expect(merged.hero.lead).toBe(DEFAULT_ABOUT_LAYOUT.hero.lead); // preserved default
    expect(merged.manifesto.text).toBe(DEFAULT_ABOUT_LAYOUT.manifesto.text); // preserved
    expect(merged.story.foundingYear).toBe('Est. 2024');
    expect(merged.pillars.items).toHaveLength(3); // preserved
  });

  it('supports hiding sections via enabled switches', () => {
    const withDisabled = mergeAboutLayout({
      hero: { enabled: false },
      manifesto: { enabled: false },
      stats: { enabled: false },
    });

    expect(withDisabled.hero.enabled).toBe(false);
    expect(withDisabled.manifesto.enabled).toBe(false);
    expect(withDisabled.stats.enabled).toBe(false);
    expect(withDisabled.story.enabled).toBe(true); // untouched
  });

  it('hides stats row when stats items are empty or contain only blank values', () => {
    // Empty array
    const emptyStats = mergeAboutLayout({ stats: { items: [] } });
    const validStats1 = emptyStats.stats.items.filter(
      (s) => s.value.trim() !== '' && s.label.trim() !== ''
    );
    expect(validStats1).toHaveLength(0);

    // Array with blank inputs
    const blankStats = mergeAboutLayout({
      stats: {
        items: [
          { value: '', label: '' },
          { value: '   ', label: 'Customers' },
        ],
      },
    });
    const validStats2 = blankStats.stats.items.filter(
      (s) => s.value.trim() !== '' && s.label.trim() !== ''
    );
    expect(validStats2).toHaveLength(0);

    // Valid real stats populated by owner
    const realStats = mergeAboutLayout({
      stats: {
        items: [
          { value: '64', label: 'Districts Delivered' },
          { value: '100%', label: 'Tested in Training' },
        ],
      },
    });
    const validStats3 = realStats.stats.items.filter(
      (s) => s.value.trim() !== '' && s.label.trim() !== ''
    );
    expect(validStats3).toHaveLength(2);
  });

  it('includes about_layout in site content keys and default content', () => {
    expect(SITE_CONTENT_KEYS).toContain('about_layout');
    expect(DEFAULT_CONTENT.about_layout).toBeTruthy();
    const parsed = JSON.parse(DEFAULT_CONTENT.about_layout);
    expect(parsed.hero.headline).toBe('Built for sport. Made for Bangladesh.');
  });
});
