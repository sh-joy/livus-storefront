'use client';

import { useRef, useState } from 'react';
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  Trash2,
  Plus,
  Bold,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { AboutLayout, WhyIcon } from '@/lib/about-layout';

interface AboutLayoutEditorProps {
  layout: AboutLayout;
  onChange: (layout: AboutLayout) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  onRestoreDefault: () => Promise<void>;
}

const WHY_ICONS: { label: string; value: WhyIcon }[] = [
  { label: 'Wind / Breathable', value: 'wind' },
  { label: 'Activity / Athletic', value: 'activity' },
  { label: 'Wallet / Payment', value: 'wallet' },
  { label: 'Truck / Delivery', value: 'truck' },
  { label: 'Shield / Quality', value: 'shield' },
  { label: 'Zap / Speed', value: 'zap' },
  { label: 'Award / Standard', value: 'award' },
  { label: 'Refresh / Exchange', value: 'refresh-cw' },
];

export function AboutLayoutEditor({
  layout,
  onChange,
  onSave,
  saving,
  onRestoreDefault,
}: AboutLayoutEditorProps) {
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const heroFileRef = useRef<HTMLInputElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const pillarFileRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleUpload = async (file: File | undefined, target: string) => {
    if (!file) return;
    setUploadingField(target);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false, message: 'Upload failed' }));
      if (!data.success || !data.urls?.[0]) throw new Error(data.message || 'Upload failed');
      const url = data.urls[0];

      if (target === 'hero') {
        onChange({ ...layout, hero: { ...layout.hero, imageUrl: url } });
      } else if (target === 'story') {
        onChange({ ...layout, story: { ...layout.story, imageUrl: url } });
      } else if (target.startsWith('pillar-')) {
        const index = parseInt(target.replace('pillar-', ''), 10);
        const updatedItems = [...layout.pillars.items];
        if (updatedItems[index]) {
          updatedItems[index] = { ...updatedItems[index], imageUrl: url };
          onChange({ ...layout, pillars: { ...layout.pillars, items: updatedItems } });
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to upload image.');
    } finally {
      setUploadingField(null);
    }
  };

  const insertBold = (
    currentText: string,
    setText: (next: string) => void,
    textareaEl: HTMLTextAreaElement | null
  ) => {
    if (!textareaEl) return;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const selected = currentText.slice(start, end) || 'bold text';
    const next = `${currentText.slice(0, start)}**${selected}**${currentText.slice(end)}`;
    setText(next);
  };

  const storyBodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-neutral-50 border border-border">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> About Page Design Layout
          </h2>
          <p className="text-xs text-muted-foreground">
            Customise the designed sportswear brand About page. All images upload directly to Vercel Blob.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-neutral-100"
          >
            Preview page <ExternalLink className="size-3" />
          </a>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={onRestoreDefault}
          >
            <RotateCcw className="size-3.5 mr-1" /> Restore Defaults
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
            Save Layout
          </Button>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">1. Hero Statement</CardTitle>
            <CardDescription>
              Full-width brand statement with display headline. Falls back to solid black if no image is uploaded.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.hero.enabled}
              onCheckedChange={(val) => onChange({ ...layout, hero: { ...layout.hero, enabled: val } })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Display Headline (max 2 lines)</label>
              <Input
                value={layout.hero.headline}
                onChange={(e) =>
                  onChange({ ...layout, hero: { ...layout.hero, headline: e.target.value } })
                }
                placeholder="Built for sport. Made for Bangladesh."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Lead Subtitle</label>
              <Input
                value={layout.hero.lead}
                onChange={(e) =>
                  onChange({ ...layout, hero: { ...layout.hero, lead: e.target.value } })
                }
                placeholder="Jerseys, training tops and activewear engineered for heat, movement and high performance."
              />
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-2 rounded-lg border p-4 bg-neutral-50/50">
              <label className="text-xs font-semibold">Hero Photo (optional)</label>
              <div className="flex items-center gap-4">
                <div className="size-20 bg-neutral-200 rounded border overflow-hidden relative shrink-0">
                  {layout.hero.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={layout.hero.imageUrl}
                      alt="Hero"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
                      No Image (Solid Black)
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={heroFileRef}
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], 'hero')}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingField === 'hero'}
                      onClick={() => heroFileRef.current?.click()}
                    >
                      {uploadingField === 'hero' ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <ImagePlus className="size-3 mr-1" />
                      )}
                      {layout.hero.imageUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {layout.hero.imageUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onChange({ ...layout, hero: { ...layout.hero, imageUrl: '' } })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Recommended: high-resolution athletic or training shot (16:9 or 4:3).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. MANIFESTO SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">2. Manifesto</CardTitle>
            <CardDescription>
              Short uppercase paragraph (eyebrow tracking, max ~60 words) centered with generous padding.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.manifesto.enabled}
              onCheckedChange={(val) =>
                onChange({ ...layout, manifesto: { ...layout.manifesto, enabled: val } })
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Manifesto Text</label>
            <textarea
              rows={3}
              value={layout.manifesto.text}
              onChange={(e) =>
                onChange({ ...layout, manifesto: { ...layout.manifesto, text: e.target.value } })
              }
              className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm uppercase font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. THREE PILLARS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">3. Three Pillars</CardTitle>
            <CardDescription>
              3-column grid highlighting brand craftsmanship, climate engineering, and limited drops.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.pillars.enabled}
              onCheckedChange={(val) =>
                onChange({ ...layout, pillars: { ...layout.pillars, enabled: val } })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Section Heading</label>
            <Input
              value={layout.pillars.heading}
              onChange={(e) =>
                onChange({ ...layout, pillars: { ...layout.pillars, heading: e.target.value } })
              }
              placeholder="How we build"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {layout.pillars.items.map((pillar, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 rounded-lg border bg-neutral-50/50">
                <span className="text-xs font-bold font-mono text-muted-foreground">Pillar 0{idx + 1}</span>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold">Title</label>
                  <Input
                    value={pillar.title}
                    onChange={(e) => {
                      const nextItems = [...layout.pillars.items];
                      nextItems[idx] = { ...pillar, title: e.target.value };
                      onChange({ ...layout, pillars: { ...layout.pillars, items: nextItems } });
                    }}
                    placeholder={`Pillar ${idx + 1}`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold">Description</label>
                  <textarea
                    rows={2}
                    value={pillar.description}
                    onChange={(e) => {
                      const nextItems = [...layout.pillars.items];
                      nextItems[idx] = { ...pillar, description: e.target.value };
                      onChange({ ...layout, pillars: { ...layout.pillars, items: nextItems } });
                    }}
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                  />
                </div>

                {/* Pillar image */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="size-12 bg-neutral-200 rounded border overflow-hidden shrink-0">
                    {pillar.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pillar.imageUrl} alt="Pillar" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-[9px] text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={pillarFileRefs[idx]}
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], `pillar-${idx}`)}
                  />
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      disabled={uploadingField === `pillar-${idx}`}
                      onClick={() => pillarFileRefs[idx]?.current?.click()}
                    >
                      {uploadingField === `pillar-${idx}` ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : (
                        <ImagePlus className="size-3 mr-1" />
                      )}
                      Upload
                    </Button>
                    {pillar.imageUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          const nextItems = [...layout.pillars.items];
                          nextItems[idx] = { ...pillar, imageUrl: '' };
                          onChange({ ...layout, pillars: { ...layout.pillars, items: nextItems } });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. STORY BLOCK */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">4. Brand Story</CardTitle>
            <CardDescription>
              Two-column section with story photo, heading, paragraph, and optional verified founding year.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.story.enabled}
              onCheckedChange={(val) =>
                onChange({ ...layout, story: { ...layout.story, enabled: val } })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Story Headline</label>
              <Input
                value={layout.story.headline}
                onChange={(e) =>
                  onChange({ ...layout, story: { ...layout.story, headline: e.target.value } })
                }
                placeholder="Rooted in Dhaka. Built for every pitch and court."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Founding Year Tag (optional)</label>
                <span className="text-[11px] text-amber-700 flex items-center gap-1">
                  <Info className="size-3" /> Leave blank unless confirmed
                </span>
              </div>
              <Input
                value={layout.story.foundingYear}
                onChange={(e) =>
                  onChange({ ...layout, story: { ...layout.story, foundingYear: e.target.value } })
                }
                placeholder="e.g. Est. 2024"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Body Copy</label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={() =>
                  insertBold(
                    layout.story.body,
                    (val) => onChange({ ...layout, story: { ...layout.story, body: val } }),
                    storyBodyRef.current
                  )
                }
              >
                <Bold className="size-3 mr-1" /> Bold
              </Button>
            </div>
            <textarea
              ref={storyBodyRef}
              rows={4}
              value={layout.story.body}
              onChange={(e) =>
                onChange({ ...layout, story: { ...layout.story, body: e.target.value } })
              }
              className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm"
            />
          </div>

          {/* Story photo upload */}
          <div className="flex flex-col gap-2 rounded-lg border p-4 bg-neutral-50/50">
            <label className="text-xs font-semibold">Story Photo</label>
            <div className="flex items-center gap-4">
              <div className="size-20 bg-neutral-200 rounded border overflow-hidden relative shrink-0">
                {layout.story.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={layout.story.imageUrl} alt="Story" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={storyFileRef}
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'story')}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadingField === 'story'}
                    onClick={() => storyFileRef.current?.click()}
                  >
                    {uploadingField === 'story' ? (
                      <Loader2 className="size-3 animate-spin mr-1" />
                    ) : (
                      <ImagePlus className="size-3 mr-1" />
                    )}
                    {layout.story.imageUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {layout.story.imageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        onChange({ ...layout, story: { ...layout.story, imageUrl: '' } })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. WHY LIVUS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">5. Why LIVUS (4 Items)</CardTitle>
            <CardDescription>
              Key brand guarantees: breathable fabrics, athletic cut, payment methods, and delivery. No offer text.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.why.enabled}
              onCheckedChange={(val) => onChange({ ...layout, why: { ...layout.why, enabled: val } })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Section Heading</label>
            <Input
              value={layout.why.heading}
              onChange={(e) =>
                onChange({ ...layout, why: { ...layout.why, heading: e.target.value } })
              }
              placeholder="Why LIVUS"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {layout.why.items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2.5 p-3.5 rounded-lg border bg-neutral-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-muted-foreground">Item 0{idx + 1}</span>
                  <select
                    value={item.icon}
                    onChange={(e) => {
                      const nextItems = [...layout.why.items];
                      nextItems[idx] = { ...item, icon: e.target.value as WhyIcon };
                      onChange({ ...layout, why: { ...layout.why, items: nextItems } });
                    }}
                    className="text-xs rounded border border-input bg-white px-2 py-1"
                  >
                    {WHY_ICONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold">Title</label>
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const nextItems = [...layout.why.items];
                      nextItems[idx] = { ...item, title: e.target.value };
                      onChange({ ...layout, why: { ...layout.why, items: nextItems } });
                    }}
                    placeholder={`Item ${idx + 1}`}
                    className="text-xs h-8"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold">Description</label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => {
                      const nextItems = [...layout.why.items];
                      nextItems[idx] = { ...item, description: e.target.value };
                      onChange({ ...layout, why: { ...layout.why, items: nextItems } });
                    }}
                    className="w-full rounded-md border border-input bg-transparent p-2 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. STATS / NUMBERS ROW (OPTIONAL) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">6. Key Stats Row (Optional)</CardTitle>
            <CardDescription>
              Up to 4 verifiable statistics. IMPORTANT: Hidden entirely on the storefront if left empty or all values blank.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.stats.enabled}
              onCheckedChange={(val) =>
                onChange({ ...layout, stats: { ...layout.stats, enabled: val } })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
              <label className="text-xs font-semibold">Optional Heading</label>
              <Input
                value={layout.stats.heading}
                onChange={(e) =>
                  onChange({ ...layout, stats: { ...layout.stats, heading: e.target.value } })
                }
                placeholder="e.g. By the numbers"
              />
            </div>
            {layout.stats.items.length < 4 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const nextItems = [...layout.stats.items, { value: '', label: '' }];
                  onChange({ ...layout, stats: { ...layout.stats, items: nextItems } });
                }}
              >
                <Plus className="size-3.5 mr-1" /> Add Stat ({layout.stats.items.length}/4)
              </Button>
            )}
          </div>

          {layout.stats.items.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
              No stats added. This section is currently hidden from visitors.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {layout.stats.items.map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono">Stat 0{idx + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="size-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        const nextItems = layout.stats.items.filter((_, i) => i !== idx);
                        onChange({ ...layout, stats: { ...layout.stats, items: nextItems } });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={stat.value}
                    onChange={(e) => {
                      const nextItems = [...layout.stats.items];
                      nextItems[idx] = { ...stat, value: e.target.value };
                      onChange({ ...layout, stats: { ...layout.stats, items: nextItems } });
                    }}
                    placeholder="e.g. 64"
                    className="font-bold text-sm"
                  />
                  <Input
                    value={stat.label}
                    onChange={(e) => {
                      const nextItems = [...layout.stats.items];
                      nextItems[idx] = { ...stat, label: e.target.value };
                      onChange({ ...layout, stats: { ...layout.stats, items: nextItems } });
                    }}
                    placeholder="e.g. Districts covered"
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. CTA SECTION */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">7. Call to Action (CTA)</CardTitle>
            <CardDescription>
              Two prominent buttons directing athletes to Men&apos;s and Women&apos;s collections.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show section</span>
            <Switch
              checked={layout.cta.enabled}
              onCheckedChange={(val) => onChange({ ...layout, cta: { ...layout.cta, enabled: val } })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Heading</label>
              <Input
                value={layout.cta.heading}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, heading: e.target.value } })
                }
                placeholder="Ready to train?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Lead Subtitle</label>
              <Input
                value={layout.cta.lead}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, lead: e.target.value } })
                }
                placeholder="Explore the latest collection engineered for match-day intensity."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-neutral-50/50">
              <span className="text-xs font-bold">Button 1 (Men&apos;s Sportswear)</span>
              <Input
                value={layout.cta.buttonMenText}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, buttonMenText: e.target.value } })
                }
                placeholder="Shop men's sportswear"
              />
              <Input
                value={layout.cta.buttonMenHref}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, buttonMenHref: e.target.value } })
                }
                placeholder="/for-him"
                className="font-mono text-xs"
              />
            </div>

            <div className="flex flex-col gap-2 p-3.5 rounded-lg border bg-neutral-50/50">
              <span className="text-xs font-bold">Button 2 (Women&apos;s Sportswear)</span>
              <Input
                value={layout.cta.buttonWomenText}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, buttonWomenText: e.target.value } })
                }
                placeholder="Shop women's sportswear"
              />
              <Input
                value={layout.cta.buttonWomenHref}
                onChange={(e) =>
                  onChange({ ...layout, cta: { ...layout.cta, buttonWomenHref: e.target.value } })
                }
                placeholder="/for-her"
                className="font-mono text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onRestoreDefault}
        >
          <RotateCcw className="size-4 mr-1.5" /> Restore Defaults
        </Button>
        <Button type="button" disabled={saving} onClick={onSave} className="min-w-[140px]">
          {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
          Save About Layout
        </Button>
      </div>
    </div>
  );
}
