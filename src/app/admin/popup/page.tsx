'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ImagePlus, Trash2, Megaphone, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getAdminPromoPopupAction, saveAdminPromoPopupAction, type PromoPopupConfig } from '@/app/actions/promo-popup';

type Form = Omit<PromoPopupConfig, 'version'>;

/** Shrink big phone photos in the browser before upload (same approach as product photos). */
async function shrinkImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const field = 'flex flex-col gap-1.5 text-xs';
const labelCls = 'font-semibold text-foreground';
const hint = 'text-[11px] text-muted-foreground';
const textareaCls =
  'w-full min-h-[84px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

export default function AdminPopupPage() {
  const [form, setForm] = useState<Form | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAdminPromoPopupAction()
      .then(({ config, tableReady }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { version: _v, ...rest } = config;
        setForm(rest);
        setTableReady(tableReady);
      })
      .catch((err) => setNotice({ ok: false, text: err?.message || 'Could not load popup settings.' }));
  }, []);

  if (!form) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6">
        <Loader2 className="size-4 animate-spin" /> Loading popup settings…
      </div>
    );
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('files', await shrinkImage(file));
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false, message: `Upload failed (HTTP ${res.status})` }));
      if (!data.success || !data.urls?.[0]) throw new Error(data.message || 'Upload failed');
      set('imageUrl', data.urls[0]);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await saveAdminPromoPopupAction(form);
      setNotice(res.success ? { ok: true, text: 'Saved. Visitors will see the updated popup.' } : { ok: false, text: res.message || 'Could not save.' });
      if (res.success) setTableReady(true);
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="size-5" /> Offer Popup
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            A newsletter / offer popup shown to shoppers. Not shown on checkout, sign-in or admin pages. Email sign-ups go to Newsletter CRM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch checked={form.isEnabled} onCheckedChange={(v) => set('isEnabled', Boolean(v))} />
            {form.isEnabled ? 'Popup is ON' : 'Popup is OFF'}
          </label>
          <a href="/?popup-preview=1" target="_blank" rel="noopener" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
            Preview on site
          </a>
          <Button onClick={onSave} disabled={saving || uploading}>
            {saving && <Loader2 className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </div>

      {!tableReady && (
        <div className="flex gap-2 items-start rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>
            The popup table doesn&apos;t exist in this database yet. Run <code>drizzle/manual/0006_promo_popup.sql</code> once (Neon → SQL Editor), then save.
          </span>
        </div>
      )}
      {notice && (
        <div className={`rounded-md border p-3 text-xs ${notice.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
            <CardDescription className="text-xs">Image on the left, text and email sign-up on the right.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className={field}>
              <span className={labelCls}>Image</span>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Upload image
                </Button>
                {form.imageUrl && (
                  <Button type="button" variant="ghost" onClick={() => set('imageUrl', '')}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                )}
              </div>
              <Input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="…or paste an https:// image link" />
              <span className={hint}>Portrait works best (about 4:5). Leave empty for a text-only popup.</span>
            </div>

            <div className={field}>
              <span className={labelCls}>Headline</span>
              <Input value={form.headline} maxLength={140} onChange={(e) => set('headline', e.target.value)} placeholder="Unlock 30% off on select styles" />
            </div>
            <div className={field}>
              <span className={labelCls}>Text</span>
              <textarea className={textareaCls} value={form.body} maxLength={400} onChange={(e) => set('body', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={field}>
                <span className={labelCls}>Button text</span>
                <Input value={form.buttonLabel} maxLength={40} onChange={(e) => set('buttonLabel', e.target.value)} />
              </div>
              <div className={field}>
                <span className={labelCls}>Small print</span>
                <Input value={form.finePrint} maxLength={200} onChange={(e) => set('finePrint', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={field}>
                <span className={labelCls}>Show after (seconds)</span>
                <Input type="number" min={0} max={120} value={form.delaySeconds} onChange={(e) => set('delaySeconds', Number(e.target.value))} />
              </div>
              <div className={field}>
                <span className={labelCls}>Show again after (days)</span>
                <Input type="number" min={0} max={365} value={form.showAgainDays} onChange={(e) => set('showAgainDays', Number(e.target.value))} />
                <span className={hint}>0 = once per visitor. Saving a new offer shows it to everyone again.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription className="text-xs">Roughly how it looks on desktop. On phones the image sits on top. Save, then use “Preview on site” for the real thing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid border bg-white overflow-hidden ${form.imageUrl ? 'grid-cols-[5fr_6fr]' : ''}`}>
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="" className="w-full h-full min-h-[300px] object-cover bg-neutral-100" />
              )}
              <div className="flex flex-col justify-center text-center gap-3 p-6">
                <p className="text-lg font-bold uppercase leading-tight">{form.headline || 'Headline'}</p>
                {form.body && <p className="text-xs text-neutral-600">{form.body}</p>}
                <div className="h-9 bg-neutral-100 text-left text-xs text-neutral-500 px-3 flex items-center mt-2">Enter your email</div>
                <div className="h-9 bg-neutral-950 text-white text-xs uppercase tracking-wider flex items-center justify-center">{form.buttonLabel || 'Join'}</div>
                {form.finePrint && <p className="text-[10px] text-neutral-500">{form.finePrint}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
