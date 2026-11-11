'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  FileText,
  AlertTriangle,
  Bold,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Mail,
  ImagePlus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichText } from '@/components/storefront/RichText';
import {
  getAllAdminSiteContentAction,
  saveSiteContentAction,
} from '@/app/actions/site-content';
import {
  type SiteContentKey,
  type FaqItem,
  type NewsletterCtaConfig,
  DEFAULT_FAQS,
  DEFAULT_NEWSLETTER_CTA,
  DEFAULT_CONTENT,
} from '@/content/site-content-defaults';

type TabType = 'info' | 'storefront' | 'contact';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [contents, setContents] = useState<Record<SiteContentKey, { value: string; isCustom: boolean }> | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Parsed structured states
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [newsletterCta, setNewsletterCta] = useState<NewsletterCtaConfig>(DEFAULT_NEWSLETTER_CTA);
  const [uploadingImage, setUploadingImage] = useState(false);
  const ctaImageRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const res = await getAllAdminSiteContentAction();
      setContents(res.contents);
      setTableReady(res.tableReady);

      // Parse FAQs
      try {
        const rawFaqs = res.contents.contact_faqs?.value;
        if (rawFaqs) {
          const parsed = JSON.parse(rawFaqs);
          if (Array.isArray(parsed) && parsed.length > 0) setFaqs(parsed);
        }
      } catch {}

      // Parse Newsletter CTA
      try {
        const rawCta = res.contents.newsletter_cta?.value;
        if (rawCta) {
          const parsed = JSON.parse(rawCta);
          if (parsed && typeof parsed === 'object') setNewsletterCta({ ...DEFAULT_NEWSLETTER_CTA, ...parsed });
        }
      } catch {}
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Could not load site content.' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!contents) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="size-4 animate-spin" /> Loading editable page texts…
      </div>
    );
  }

  const updateText = (key: SiteContentKey, text: string) => {
    setContents({
      ...contents,
      [key]: { value: text, isCustom: text.trim() !== '' },
    });
  };

  const saveText = async (key: SiteContentKey, rawVal?: string) => {
    const val = rawVal !== undefined ? rawVal : contents[key]?.value || '';
    setSavingKey(key);
    setNotice(null);
    try {
      const res = await saveSiteContentAction({ key, value: val });
      if (!res.success) throw new Error(res.message || 'Save failed.');
      setNotice({ ok: true, text: `Successfully updated ${key.replace(/_/g, ' ')}.` });
      await loadData();
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Failed to save.' });
    } finally {
      setSavingKey(null);
    }
  };

  const restoreDefault = async (key: SiteContentKey) => {
    await saveText(key, '');
  };

  const handleCtaImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false, message: 'Upload failed' }));
      if (!data.success || !data.urls?.[0]) throw new Error(data.message || 'Upload failed');
      const updated = { ...newsletterCta, imageUrl: data.urls[0] };
      setNewsletterCta(updated);
      await saveText('newsletter_cta', JSON.stringify(updated));
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Upload failed' });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pages & Storefront Text</h1>
        <p className="text-sm text-muted-foreground">
          Customise information pages, FAQs, homepage collection highlights, and footer newsletter text.
        </p>
      </div>

      {!tableReady && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Database migration required</p>
            <p>
              The <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">site_content</code> table is not ready yet.
              Run <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">drizzle/manual/0007_site_profile.sql</code> in Neon SQL editor.
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className={`rounded-lg p-3 text-sm flex items-center justify-between ${
            notice.ok
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Legal & Info Pages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'contact'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Contact & FAQs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('storefront')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'storefront'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Storefront & Newsletter CTA
        </button>
      </div>

      {/* TAB 1: INFO & LEGAL PAGES */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* About Us */}
          <ContentBlockCard
            title="About Us (/about)"
            description="Brand history and atelier introduction on the About page."
            contentKey="about_page"
            value={contents.about_page?.value || ''}
            isCustom={contents.about_page?.isCustom || false}
            saving={savingKey === 'about_page'}
            onChange={(val) => updateText('about_page', val)}
            onSave={() => saveText('about_page')}
            onRestore={() => restoreDefault('about_page')}
            viewUrl="/about"
          />

          {/* Privacy Policy */}
          <ContentBlockCard
            title="Privacy Policy (/privacy)"
            description="Customer data collection, security, and verification terms."
            contentKey="privacy_page"
            value={contents.privacy_page?.value || ''}
            isCustom={contents.privacy_page?.isCustom || false}
            saving={savingKey === 'privacy_page'}
            onChange={(val) => updateText('privacy_page', val)}
            onSave={() => saveText('privacy_page')}
            onRestore={() => restoreDefault('privacy_page')}
            viewUrl="/privacy"
          />

          {/* Terms & Conditions */}
          <ContentBlockCard
            title="Terms & Conditions (/terms)"
            description="Ordering, pricing, and purchase agreement."
            contentKey="terms_page"
            value={contents.terms_page?.value || ''}
            isCustom={contents.terms_page?.isCustom || false}
            saving={savingKey === 'terms_page'}
            onChange={(val) => updateText('terms_page', val)}
            onSave={() => saveText('terms_page')}
            onRestore={() => restoreDefault('terms_page')}
            viewUrl="/terms"
          />

          {/* Shipping & Returns Page */}
          <ContentBlockCard
            title="Shipping & Returns Page (/shipping-returns)"
            description="Detailed shipping terms, speed, and 7-day exchange policies."
            contentKey="shipping_page"
            value={contents.shipping_page?.value || ''}
            isCustom={contents.shipping_page?.isCustom || false}
            saving={savingKey === 'shipping_page'}
            onChange={(val) => updateText('shipping_page', val)}
            onSave={() => saveText('shipping_page')}
            onRestore={() => restoreDefault('shipping_page')}
            viewUrl="/shipping-returns"
          />

          {/* Cookie Policy */}
          <ContentBlockCard
            title="Cookie Policy (/cookies)"
            description="Cookie disclosure, strictly necessary, functional and analytical cookie usage."
            contentKey="cookies_page"
            value={contents.cookies_page?.value || ''}
            isCustom={contents.cookies_page?.isCustom || false}
            saving={savingKey === 'cookies_page'}
            onChange={(val) => updateText('cookies_page', val)}
            onSave={() => saveText('cookies_page')}
            onRestore={() => restoreDefault('cookies_page')}
            viewUrl="/cookies"
          />
        </div>
      )}

      {/* TAB 2: CONTACT & FAQS */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          {/* Contact Intro */}
          <ContentBlockCard
            title="Contact Intro Paragraph (/contact)"
            description="Lead paragraph shown above the Bangladesh contact details."
            contentKey="contact_intro"
            value={contents.contact_intro?.value || ''}
            isCustom={contents.contact_intro?.isCustom || false}
            saving={savingKey === 'contact_intro'}
            onChange={(val) => updateText('contact_intro', val)}
            onSave={() => saveText('contact_intro')}
            onRestore={() => restoreDefault('contact_intro')}
            viewUrl="/contact"
          />

          {/* FAQs List Editor */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="size-5 text-primary" /> Frequently Asked Questions ({faqs.length})
                </CardTitle>
                <CardDescription>
                  Editable accordion questions and answers rendered on the Contact page.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFaqs(DEFAULT_FAQS);
                    saveText('contact_faqs', JSON.stringify(DEFAULT_FAQS));
                  }}
                  className="text-xs"
                >
                  <RotateCcw className="size-3 mr-1" /> Reset to defaults
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveText('contact_faqs', JSON.stringify(faqs))}
                  disabled={savingKey === 'contact_faqs'}
                >
                  {savingKey === 'contact_faqs' && <Loader2 className="size-3 animate-spin mr-1" />}
                  Save FAQs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-lg border p-4 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Question #{idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        disabled={idx === 0}
                        onClick={() => {
                          const list = [...faqs];
                          const [item] = list.splice(idx, 1);
                          list.splice(idx - 1, 0, item);
                          setFaqs(list);
                        }}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        disabled={idx === faqs.length - 1}
                        onClick={() => {
                          const list = [...faqs];
                          const [item] = list.splice(idx, 1);
                          list.splice(idx + 1, 0, item);
                          setFaqs(list);
                        }}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={faq.q}
                    onChange={(e) => {
                      const list = [...faqs];
                      list[idx].q = e.target.value;
                      setFaqs(list);
                    }}
                    placeholder="e.g. How do I place an order?"
                    className="font-medium bg-white"
                  />
                  <textarea
                    rows={2}
                    value={faq.a}
                    onChange={(e) => {
                      const list = [...faqs];
                      list[idx].a = e.target.value;
                      setFaqs(list);
                    }}
                    placeholder="Answer text..."
                    className="w-full rounded-md border border-input bg-white p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setFaqs([...faqs, { q: 'New question', a: 'Answer...' }])}
              >
                <Plus className="size-4 mr-1.5" /> Add another FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: STOREFRONT & NEWSLETTER */}
      {activeTab === 'storefront' && (
        <div className="space-y-6">
          {/* Home Collection description */}
          <ContentBlockCard
            title="Homepage: 'Explore the collection' Description"
            description="Subtitle shown on the homepage right under 'Explore the collection'."
            contentKey="home_collection_text"
            value={contents.home_collection_text?.value || ''}
            isCustom={contents.home_collection_text?.isCustom || false}
            saving={savingKey === 'home_collection_text'}
            onChange={(val) => updateText('home_collection_text', val)}
            onSave={() => saveText('home_collection_text')}
            onRestore={() => restoreDefault('home_collection_text')}
            viewUrl="/"
          />

          {/* Category Intros (Search & Category Header copy) */}
          <ContentBlockCard
            title="For Him Category Intro (/for-him)"
            description="Introductory sentence for search and category header describing LIVUS men's collection."
            contentKey="category_for_him_intro"
            value={contents.category_for_him_intro?.value || ''}
            isCustom={contents.category_for_him_intro?.isCustom || false}
            saving={savingKey === 'category_for_him_intro'}
            onChange={(val) => updateText('category_for_him_intro', val)}
            onSave={() => saveText('category_for_him_intro')}
            onRestore={() => restoreDefault('category_for_him_intro')}
            viewUrl="/for-him"
          />

          <ContentBlockCard
            title="For Her Category Intro (/for-her)"
            description="Introductory sentence for search and category header describing LIVUS women's collection."
            contentKey="category_for_her_intro"
            value={contents.category_for_her_intro?.value || ''}
            isCustom={contents.category_for_her_intro?.isCustom || false}
            saving={savingKey === 'category_for_her_intro'}
            onChange={(val) => updateText('category_for_her_intro', val)}
            onSave={() => saveText('category_for_her_intro')}
            onRestore={() => restoreDefault('category_for_her_intro')}
            viewUrl="/for-her"
          />

          <ContentBlockCard
            title="Unisex Category Intro (/unisex)"
            description="Introductory sentence for search and category header describing LIVUS unisex collection."
            contentKey="category_unisex_intro"
            value={contents.category_unisex_intro?.value || ''}
            isCustom={contents.category_unisex_intro?.isCustom || false}
            saving={savingKey === 'category_unisex_intro'}
            onChange={(val) => updateText('category_unisex_intro', val)}
            onSave={() => saveText('category_unisex_intro')}
            onRestore={() => restoreDefault('category_unisex_intro')}
            viewUrl="/unisex"
          />

          <ContentBlockCard
            title="Accessories Category Intro (/accessories)"
            description="Introductory sentence for search and category header describing LIVUS accessories collection."
            contentKey="category_accessories_intro"
            value={contents.category_accessories_intro?.value || ''}
            isCustom={contents.category_accessories_intro?.isCustom || false}
            saving={savingKey === 'category_accessories_intro'}
            onChange={(val) => updateText('category_accessories_intro', val)}
            onSave={() => saveText('category_accessories_intro')}
            onRestore={() => restoreDefault('category_accessories_intro')}
            viewUrl="/accessories"
          />

          {/* Footer Newsletter CTA */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="size-5 text-primary" /> Footer Newsletter CTA Block
                </CardTitle>
                <CardDescription>
                  The large banner above the footer with brand headline, copy, button, and featured photo.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewsletterCta(DEFAULT_NEWSLETTER_CTA);
                    saveText('newsletter_cta', JSON.stringify(DEFAULT_NEWSLETTER_CTA));
                  }}
                  className="text-xs"
                >
                  <RotateCcw className="size-3 mr-1" /> Reset to defaults
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveText('newsletter_cta', JSON.stringify(newsletterCta))}
                  disabled={savingKey === 'newsletter_cta'}
                >
                  {savingKey === 'newsletter_cta' && <Loader2 className="size-3 animate-spin mr-1" />}
                  Save Newsletter CTA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold">Heading (Markdown bold and linebreaks supported)</label>
                  <textarea
                    rows={2}
                    value={newsletterCta.heading}
                    onChange={(e) => setNewsletterCta({ ...newsletterCta, heading: e.target.value })}
                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold">Button Label</label>
                  <Input
                    value={newsletterCta.buttonLabel}
                    onChange={(e) => setNewsletterCta({ ...newsletterCta, buttonLabel: e.target.value })}
                    placeholder="Subscribe"
                  />
                  <span className="text-[11px] text-muted-foreground">Default: &quot;Subscribe&quot;</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold">Body Copy</label>
                <textarea
                  rows={2}
                  value={newsletterCta.text}
                  onChange={(e) => setNewsletterCta({ ...newsletterCta, text: e.target.value })}
                  className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg border p-4 bg-neutral-50/50">
                <label className="text-xs font-semibold">Featured Photo</label>
                <div className="flex items-center gap-4">
                  <div className="size-20 bg-neutral-200 rounded border overflow-hidden relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newsletterCta.imageUrl} alt="CTA Preview" className="size-full object-cover object-bottom" />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={ctaImageRef}
                      className="hidden"
                      onChange={(e) => handleCtaImageUpload(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={uploadingImage}
                      onClick={() => ctaImageRef.current?.click()}
                    >
                      {uploadingImage ? <Loader2 className="size-3 animate-spin mr-1" /> : <ImagePlus className="size-3 mr-1" />}
                      Change Photo
                    </Button>
                    <p className="text-[11px] text-muted-foreground">Recommended: transparent cutout or athletic photo.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ContentBlockCardProps {
  title: string;
  description: string;
  contentKey: SiteContentKey;
  value: string;
  isCustom: boolean;
  saving: boolean;
  viewUrl: string;
  onChange: (val: string) => void;
  onSave: () => void;
  onRestore: () => void;
}

function ContentBlockCard({
  title,
  description,
  contentKey,
  value,
  isCustom,
  saving,
  viewUrl,
  onChange,
  onSave,
  onRestore,
}: ContentBlockCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertBold = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || 'bold text';
    const next = `${value.slice(0, start)}**${selected}**${value.slice(end)}`;
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2 + selected.length);
    }, 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-5 text-primary" /> {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {viewUrl && (
            <Link
              href={viewUrl}
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mr-2"
            >
              View page <ExternalLink className="size-3" />
            </Link>
          )}
          {isCustom && (
            <Button size="sm" variant="ghost" onClick={onRestore} className="text-xs text-muted-foreground">
              <RotateCcw className="size-3 mr-1" /> Reset to default
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="size-3 animate-spin mr-1" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button type="button" size="sm" variant="outline" onClick={insertBold} className="text-xs h-7 gap-1">
            <Bold className="size-3" /> Bold (**text**)
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Supports **bold**, bullets (- item), and empty lines for paragraphs.
          </span>
        </div>

        <textarea
          ref={textareaRef}
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent p-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />

        {/* Live RichText Preview Box */}
        <div className="rounded-lg border p-4 bg-neutral-50/50 space-y-2">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
            Live Storefront Preview
          </span>
          <div className="bg-white p-4 rounded border text-sm">
            <RichText text={value} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
