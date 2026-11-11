'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminSiteContentAction, saveSiteContentAction } from '@/app/actions/site-content';
import { RichText } from '@/components/storefront/RichText';

/** Admin → Settings: the "Shipping, Delivery & Returns" text shown on every product page. */
export function ProductPageTextEditor() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableReady, setTableReady] = useState(true);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getAdminSiteContentAction('shipping_returns')
      .then((r) => {
        setValue(r.value);
        setTableReady(r.tableReady);
      })
      .catch(() => setNotice({ ok: false, text: 'Could not load the text.' }))
      .finally(() => setLoading(false));
  }, []);

  // Wrap the selected words in **…** (same as the product description editor).
  const makeBold = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if (a === b) return;
    const next = `${value.slice(0, a)}**${value.slice(a, b)}**${value.slice(b)}`;
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + 2, b + 2);
    });
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const res = await saveSiteContentAction({ key: 'shipping_returns', value });
    setSaving(false);
    setNotice(res.success ? { ok: true, text: 'Saved. Product pages now show this text.' } : { ok: false, text: res.message || 'Could not save.' });
    if (res.success) setTableReady(true);
  };

  return (
    <Card className="rounded-none shadow-none border-neutral-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">Product page: Shipping, Delivery &amp; Returns</CardTitle>
        <CardDescription className="text-xs">
          Shown in the “Shipping, Delivery &amp; Returns” section on every product page. Select words and press B (or Ctrl/Cmd+B) for bold.
          Leave a blank line between paragraphs. Clear the box and save to go back to the automatic text.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!tableReady && (
          <div className="flex gap-2 items-start border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>Run <code>drizzle/manual/0006_promo_popup.sql</code> on the database once to be able to save this text.</span>
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="sm" className="h-7 rounded-none" onClick={makeBold} title="Bold (Ctrl/Cmd+B)">
                  <Bold className="size-3.5" />
                </Button>
              </div>
              <textarea
                ref={ref}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
                    e.preventDefault();
                    makeBold();
                  }
                }}
                rows={10}
                maxLength={4000}
                className="w-full rounded-none border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="border border-neutral-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Preview</p>
              <RichText text={value} />
            </div>
          </div>
        )}
        {notice && <p className={`text-xs ${notice.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{notice.text}</p>}
        <div>
          <Button onClick={save} disabled={saving || loading} className="rounded-none">
            {saving && <Loader2 className="size-4 animate-spin" />} Save text
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
