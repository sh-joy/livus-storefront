'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Loader2,
  ImagePlus,
  Trash2,
  AlertTriangle,
  Globe,
  Share2,
  Building2,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Plus,
  X,
  ExternalLink,
  Bold,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getAdminSiteProfileAction,
  saveSiteProfileAction,
} from '@/app/actions/site-settings';
import { type SiteProfile } from '@/lib/site-profile';

async function shrinkImage(file: File, maxDim = 1600): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name, { type: blob.type });
  } catch {
    return file;
  }
}

const fieldCls = 'flex flex-col gap-1.5 text-xs';
const labelCls = 'font-semibold text-foreground';
const hintCls = 'text-[11px] text-muted-foreground';
const inputCls =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50';
const textareaCls =
  'w-full min-h-[96px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

export default function AdminSiteBrandPage() {
  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const lightLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const shareImgRef = useRef<HTMLInputElement>(null);
  const footerTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getAdminSiteProfileAction()
      .then(({ profile, tableReady }) => {
        setProfile(profile);
        setTableReady(tableReady);
      })
      .catch((err) =>
        setNotice({ ok: false, text: err?.message || 'Could not load site profile.' })
      );
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="size-4 animate-spin" /> Loading site profile settings…
      </div>
    );
  }

  const handleUpload = async (file: File | undefined, target: 'logoUrl' | 'logoDarkUrl' | 'faviconUrl' | 'shareImageUrl') => {
    if (!file) return;
    setUploadingTarget(target);
    setNotice(null);
    try {
      const fd = new FormData();
      const processed = await shrinkImage(file, target === 'faviconUrl' ? 512 : 1600);
      fd.append('files', processed);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false, message: `Upload failed (HTTP ${res.status})` }));
      if (!data.success || !data.urls?.[0]) throw new Error(data.message || 'Upload failed');

      if (target === 'shareImageUrl') {
        setProfile({ ...profile, seo: { ...profile.seo, shareImageUrl: data.urls[0] } });
      } else {
        setProfile({ ...profile, brand: { ...profile.brand, [target]: data.urls[0] } });
      }
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Upload failed' });
    } finally {
      setUploadingTarget(null);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await saveSiteProfileAction(profile);
      if (!res.success) throw new Error(res.message || 'Could not save.');
      setNotice({ ok: true, text: 'Site & Brand settings saved successfully.' });
    } catch (err: any) {
      setNotice({ ok: false, text: err?.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const addPhone = () => {
    setProfile({
      ...profile,
      contact: { ...profile.contact, phones: [...profile.contact.phones, ''] },
    });
  };

  const updatePhone = (index: number, val: string) => {
    const list = [...profile.contact.phones];
    list[index] = val;
    setProfile({
      ...profile,
      contact: { ...profile.contact, phones: list },
    });
  };

  const removePhone = (index: number) => {
    setProfile({
      ...profile,
      contact: {
        ...profile.contact,
        phones: profile.contact.phones.filter((_, i) => i !== index),
      },
    });
  };

  const insertBoldInFooter = () => {
    const el = footerTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = profile.footer.about;
    const selected = text.slice(start, end) || 'bold text';
    const next = `${text.slice(0, start)}**${selected}**${text.slice(end)}`;
    setProfile({ ...profile, footer: { about: next } });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2 + selected.length);
    }, 0);
  };

  const siteHost = typeof window !== 'undefined' ? window.location.host : 'mylivus.vercel.app';
  const siteProto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const canonicalBase = `${siteProto}//${siteHost}`;

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site & Brand</h1>
          <p className="text-sm text-muted-foreground">
            Configure store identity, logos, contact info, social links, footer description, and SEO share previews.
          </p>
        </div>
        <Button onClick={onSave} disabled={saving} className="sm:self-start">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save all settings'}
        </Button>
      </div>

      {!tableReady && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Database migration required</p>
            <p>
              The <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">site_content</code> table is not ready yet.
              Run <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">drizzle/manual/0007_site_profile.sql</code> in your Neon database SQL editor so changes are persisted.
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

      {/* 1. Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" /> 1. Brand Identity & Logos
          </CardTitle>
          <CardDescription>
            Store name, wordmark, light/dark logos, and browser favicon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Store Name</label>
              <Input
                value={profile.brand.name}
                onChange={(e) =>
                  setProfile({ ...profile, brand: { ...profile.brand, name: e.target.value } })
                }
                placeholder="LIVUS"
                className={inputCls}
              />
              <span className={hintCls}>Used across title tags, invoices, and brand notices.</span>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Brand Tagline</label>
              <Input
                value={profile.brand.tagline}
                onChange={(e) =>
                  setProfile({ ...profile, brand: { ...profile.brand, tagline: e.target.value } })
                }
                placeholder="Athletic Streetwear & Jerseys"
                className={inputCls}
              />
              <span className={hintCls}>Short descriptive subtitle.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Light Background Logo */}
            <div className="flex flex-col gap-2 rounded-lg border p-3 bg-neutral-50/50">
              <label className={labelCls}>Light Logo (Header / Storefront)</label>
              <span className={hintCls}>Appears on white & light headers.</span>
              <div className="h-20 w-full rounded border bg-white flex items-center justify-center p-2 overflow-hidden relative">
                {profile.brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.brand.logoUrl} alt="Light logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xl font-bold tracking-[0.2em] font-sans text-neutral-800">
                    {profile.brand.name || 'LIVUS'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  ref={lightLogoRef}
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'logoUrl')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  disabled={uploadingTarget === 'logoUrl'}
                  onClick={() => lightLogoRef.current?.click()}
                >
                  {uploadingTarget === 'logoUrl' ? <Loader2 className="size-3 animate-spin" /> : <ImagePlus className="size-3" />}
                  Upload
                </Button>
                {profile.brand.logoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setProfile({ ...profile, brand: { ...profile.brand, logoUrl: '' } })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Dark Background Logo */}
            <div className="flex flex-col gap-2 rounded-lg border p-3 bg-neutral-50/50">
              <label className={labelCls}>Dark Logo (Menu / Sign-in)</label>
              <span className={hintCls}>Appears on black & dark panels.</span>
              <div className="h-20 w-full rounded border bg-[#0d0d0d] flex items-center justify-center p-2 overflow-hidden relative">
                {profile.brand.logoDarkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.brand.logoDarkUrl} alt="Dark logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xl font-bold tracking-[0.2em] font-sans text-white">
                    {profile.brand.name || 'LIVUS'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  ref={darkLogoRef}
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'logoDarkUrl')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  disabled={uploadingTarget === 'logoDarkUrl'}
                  onClick={() => darkLogoRef.current?.click()}
                >
                  {uploadingTarget === 'logoDarkUrl' ? <Loader2 className="size-3 animate-spin" /> : <ImagePlus className="size-3" />}
                  Upload
                </Button>
                {profile.brand.logoDarkUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setProfile({ ...profile, brand: { ...profile.brand, logoDarkUrl: '' } })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Favicon */}
            <div className="flex flex-col gap-2 rounded-lg border p-3 bg-neutral-50/50">
              <label className={labelCls}>Favicon (Browser Tab)</label>
              <span className={hintCls}>Square PNG or ICO (≥ 512×512 recommended).</span>
              <div className="h-20 w-full rounded border bg-neutral-100 flex items-center justify-center p-2 overflow-hidden relative">
                {profile.brand.faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.brand.faviconUrl} alt="Favicon preview" className="size-10 object-contain rounded" />
                ) : (
                  <span className="text-xs text-muted-foreground">Default /favicon.ico</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  ref={faviconRef}
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0], 'faviconUrl')}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  disabled={uploadingTarget === 'faviconUrl'}
                  onClick={() => faviconRef.current?.click()}
                >
                  {uploadingTarget === 'faviconUrl' ? <Loader2 className="size-3 animate-spin" /> : <ImagePlus className="size-3" />}
                  Upload
                </Button>
                {profile.brand.faviconUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setProfile({ ...profile, brand: { ...profile.brand, faviconUrl: '' } })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Contact Details & Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="size-5 text-primary" /> 2. Contact & Customer Support
          </CardTitle>
          <CardDescription>
            Official support email, phone numbers, WhatsApp, business hours, and physical address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Support Email</label>
              <Input
                type="email"
                value={profile.contact.email}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contact: { ...profile.contact, email: e.target.value },
                  })
                }
                placeholder="support@livus.com.bd"
                className={inputCls}
              />
              <span className={hintCls}>Customers use this address on invoices and contact pages.</span>
            </div>

            <div className={fieldCls}>
              <label className={labelCls}>WhatsApp Number</label>
              <Input
                value={profile.contact.whatsapp}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contact: { ...profile.contact, whatsapp: e.target.value },
                  })
                }
                placeholder="01711000000"
                className={inputCls}
              />
              <span className={hintCls}>Formats into a direct wa.me link on the contact page.</span>
            </div>
          </div>

          {/* Multiple Phone Numbers */}
          <div className={fieldCls}>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Support Phone Numbers</label>
              <Button type="button" size="sm" variant="ghost" onClick={addPhone} className="text-xs h-7 gap-1">
                <Plus className="size-3" /> Add phone
              </Button>
            </div>
            {profile.contact.phones.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No phone numbers configured. Click &quot;Add phone&quot; to add one.</p>
            ) : (
              <div className="space-y-2">
                {profile.contact.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => updatePhone(idx, e.target.value)}
                      placeholder="01711000000"
                      className={inputCls}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removePhone(idx)}
                      className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <span className={hintCls}>Valid BD mobile formats (e.g. 01711000000 or +8801711000000).</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Operating / Support Hours</label>
              <Input
                value={profile.contact.hours}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contact: { ...profile.contact, hours: e.target.value },
                  })
                }
                placeholder="Sat–Thu, 10 AM – 8 PM"
                className={inputCls}
              />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Google Maps URL</label>
              <Input
                value={profile.contact.mapUrl}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    contact: { ...profile.contact, mapUrl: e.target.value },
                  })
                }
                placeholder="https://maps.google.com/..."
                className={inputCls}
              />
            </div>
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>Store / Office Address</label>
            <textarea
              rows={2}
              value={profile.contact.address}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  contact: { ...profile.contact, address: e.target.value },
                })
              }
              placeholder="House 24, Road 7, Dhanmondi, Dhaka 1205"
              className={textareaCls}
            />
            <span className={hintCls}>Multi-line address shown in the footer and contact sections.</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="size-5 text-primary" /> 3. Social Media Links
          </CardTitle>
          <CardDescription>
            Links to your official social profiles. Leaving any field blank will automatically hide that icon on the website.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={fieldCls}>
            <label className={labelCls}>Facebook Page URL</label>
            <Input
              value={profile.social.facebook}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, facebook: e.target.value } })}
              placeholder="https://www.facebook.com/livus.bd"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Instagram Profile URL</label>
            <Input
              value={profile.social.instagram}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, instagram: e.target.value } })}
              placeholder="https://www.instagram.com/livus.atelier"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>TikTok Profile URL</label>
            <Input
              value={profile.social.tiktok}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, tiktok: e.target.value } })}
              placeholder="https://www.tiktok.com/@livus"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>YouTube Channel URL</label>
            <Input
              value={profile.social.youtube}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, youtube: e.target.value } })}
              placeholder="https://www.youtube.com/@livus"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>X (Twitter) Profile URL</label>
            <Input
              value={profile.social.x}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, x: e.target.value } })}
              placeholder="https://x.com/livus"
              className={inputCls}
            />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>LinkedIn Company URL</label>
            <Input
              value={profile.social.linkedin}
              onChange={(e) => setProfile({ ...profile, social: { ...profile.social, linkedin: e.target.value } })}
              placeholder="https://www.linkedin.com/company/livus"
              className={inputCls}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Footer Description (RichText) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="size-5 text-primary" /> 4. Footer Brand Description
          </CardTitle>
          <CardDescription>
            The introductory brand summary rendered directly under the footer logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={insertBoldInFooter}
              className="text-xs h-7 gap-1"
            >
              <Bold className="size-3" /> Bold (**text**)
            </Button>
            <span className={hintCls}>Markdown bold and line-breaks supported.</span>
          </div>
          <textarea
            ref={footerTextareaRef}
            rows={3}
            value={profile.footer.about}
            onChange={(e) =>
              setProfile({ ...profile, footer: { about: e.target.value } })
            }
            className={textareaCls}
          />
        </CardContent>
      </Card>

      {/* 5. Search Engine & Social Share Preview (SEO) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="size-5 text-primary" /> 5. Search & Social Sharing (SEO)
          </CardTitle>
          <CardDescription>
            Metadata, share image card, character counts, and verification meta tags.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <div className="flex justify-between">
                <label className={labelCls}>Homepage Meta Title</label>
                <span className={`text-[11px] ${profile.seo.defaultTitle.length >= 50 && profile.seo.defaultTitle.length <= 60 ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                  {profile.seo.defaultTitle.length} chars (aim: 50–60)
                </span>
              </div>
              <Input
                value={profile.seo.defaultTitle}
                onChange={(e) =>
                  setProfile({ ...profile, seo: { ...profile.seo, defaultTitle: e.target.value } })
                }
                className={inputCls}
              />
            </div>

            <div className={fieldCls}>
              <label className={labelCls}>Title Template Pattern</label>
              <Input
                value={profile.seo.titleTemplate}
                onChange={(e) =>
                  setProfile({ ...profile, seo: { ...profile.seo, titleTemplate: e.target.value } })
                }
                placeholder="%s | LIVUS"
                className={inputCls}
              />
              <span className={hintCls}>e.g. &quot;%s | LIVUS&quot; - %s is replaced by inner page titles.</span>
            </div>
          </div>

          <div className={fieldCls}>
            <div className="flex justify-between">
              <label className={labelCls}>Default Meta Description</label>
              <span className={`text-[11px] ${profile.seo.defaultDescription.length >= 140 && profile.seo.defaultDescription.length <= 160 ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}`}>
                {profile.seo.defaultDescription.length} chars (aim: 140–160)
              </span>
            </div>
            <textarea
              rows={3}
              value={profile.seo.defaultDescription}
              onChange={(e) =>
                setProfile({ ...profile, seo: { ...profile.seo, defaultDescription: e.target.value } })
              }
              className={textareaCls}
            />
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>Keywords (comma-separated)</label>
            <Input
              value={profile.seo.keywords.join(', ')}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  seo: {
                    ...profile.seo,
                    keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                  },
                })
              }
              className={inputCls}
            />
          </div>

          {/* Share Image Upload */}
          <div className="flex flex-col gap-2 rounded-lg border p-4 bg-neutral-50/50">
            <div className="flex items-center justify-between">
              <div>
                <label className={labelCls}>Default Social Share Image (Open Graph)</label>
                <p className={hintCls}>Used when sharing your homepage or collection links on Facebook, WhatsApp, or Twitter. Recommended size: 1200×630px.</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                ref={shareImgRef}
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0], 'shareImageUrl')}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                disabled={uploadingTarget === 'shareImageUrl'}
                onClick={() => shareImgRef.current?.click()}
              >
                {uploadingTarget === 'shareImageUrl' ? <Loader2 className="size-3 animate-spin" /> : <ImagePlus className="size-3 mr-1" />}
                Upload share image
              </Button>
            </div>
            {profile.seo.shareImageUrl ? (
              <div className="relative aspect-[1200/630] max-w-md rounded-md overflow-hidden border bg-neutral-100 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.seo.shareImageUrl} alt="Share preview" className="size-full object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 size-7"
                  onClick={() => setProfile({ ...profile, seo: { ...profile.seo, shareImageUrl: '' } })}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-1">No custom image uploaded. Site falls back to dynamic OG card.</p>
            )}
          </div>

          {/* Webmaster verification tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={fieldCls}>
              <label className={labelCls}>Google Search Console Token</label>
              <Input
                value={profile.seo.googleVerification}
                onChange={(e) =>
                  setProfile({ ...profile, seo: { ...profile.seo, googleVerification: e.target.value } })
                }
                placeholder="google-site-verification code"
                className={inputCls}
              />
              <span className={hintCls}>Injected into root &lt;meta name=&quot;google-site-verification&quot;&gt;.</span>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Meta (Facebook) Domain Verification</label>
              <Input
                value={profile.seo.facebookDomainVerification}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    seo: { ...profile.seo, facebookDomainVerification: e.target.value },
                  })
                }
                placeholder="facebook-domain-verification token"
                className={inputCls}
              />
              <span className={hintCls}>Injected into root &lt;meta name=&quot;facebook-domain-verification&quot;&gt;.</span>
            </div>
          </div>

          {/* LIVE PREVIEWS */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Live Search & Social Previews</h3>

            {/* Google Search Result Preview */}
            <div className="rounded-lg border p-4 bg-white shadow-xs max-w-xl">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase block mb-2">
                Google Search Result Preview
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-neutral-700">
                  <span className="font-medium">{siteHost}</span>
                  <span className="text-neutral-400">›</span>
                </div>
                <h4 className="text-[#1a0dab] hover:underline text-[18px] leading-snug cursor-pointer font-sans truncate">
                  {profile.seo.defaultTitle}
                </h4>
                <p className="text-[#4d5156] text-xs leading-relaxed line-clamp-2">
                  {profile.seo.defaultDescription}
                </p>
              </div>
            </div>

            {/* Facebook / WhatsApp Link Share Preview */}
            <div className="rounded-lg border bg-neutral-50 overflow-hidden max-w-md shadow-xs">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase block p-3 pb-1">
                Facebook / WhatsApp Share Card Preview
              </span>
              <div className="aspect-[1200/630] w-full bg-neutral-200 flex items-center justify-center overflow-hidden relative">
                {profile.seo.shareImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.seo.shareImageUrl} alt="OG Card" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-3xl font-bold tracking-[0.2em]">{profile.brand.name}</span>
                    <span className="text-xs text-neutral-400 mt-2">{profile.brand.tagline}</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white border-t space-y-1">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">
                  {siteHost}
                </span>
                <p className="font-semibold text-sm text-neutral-900 line-clamp-1">
                  {profile.seo.defaultTitle}
                </p>
                <p className="text-xs text-neutral-600 line-clamp-2">
                  {profile.seo.defaultDescription}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={onSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save all settings'}
        </Button>
      </div>
    </div>
  );
}
