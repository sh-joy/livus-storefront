'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { getPromoPopupAction, type PromoPopupConfig } from '@/app/actions/promo-popup';
import { addNewsletterSubscriberAction } from '@/app/actions/subscribers';
import { SmartImage } from '@/components/storefront/SmartImage';
import { hasConsentBeenDecided, CONSENT_UPDATED_EVENT } from '@/lib/cookie-consent';

const STORAGE_KEY = 'livus_promo_popup';
const DAY = 24 * 60 * 60 * 1000;

// Never interrupt these flows with an offer.
const HIDDEN_PREFIXES = ['/admin', '/checkout', '/signin', '/signup', '/verify-email', '/forgot-password', '/order-confirmed'];

type Seen = { version: string; at: number; subscribed?: boolean };

function readSeen(): Seen | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Seen) : null;
  } catch {
    return null;
  }
}
function writeSeen(v: Seen) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* private mode: popup may show again next visit, that's fine */
  }
}

/** Should this visitor see this version of the popup now? */
function shouldShow(cfg: PromoPopupConfig): boolean {
  const seen = readSeen();
  if (!seen || seen.version !== cfg.version) return true; // never seen, or admin changed the offer
  if (seen.subscribed) return false;
  if (cfg.showAgainDays <= 0) return false; // "show once"
  return Date.now() - seen.at > cfg.showAgainDays * DAY;
}

export function PromoPopup() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const preview = searchParams?.get('popup-preview') === '1';
  const hidden = !preview && HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const [cfg, setCfg] = useState<PromoPopupConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  // Load the offer once per visit.
  useEffect(() => {
    let alive = true;
    getPromoPopupAction(preview)
      .then((c) => alive && setCfg(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [preview]);

  // Check cookie consent state; the promo popup must not open until consent choice is made.
  useEffect(() => {
    setConsentDecided(hasConsentBeenDecided());
    const onConsentUpdate = () => setConsentDecided(true);
    window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdate);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdate);
  }, []);

  // Open after the configured delay, only on allowed pages and after consent is decided.
  useEffect(() => {
    if (!cfg || hidden || open || (!preview && (!consentDecided || !shouldShow(cfg)))) return;
    const t = window.setTimeout(() => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    }, preview ? 300 : Math.max(0, cfg.delaySeconds) * 1000);
    return () => window.clearTimeout(t);
  }, [cfg, hidden, open, preview, consentDecided]);

  const close = (subscribed = false) => {
    if (cfg && !preview) writeSeen({ version: cfg.version, at: Date.now(), subscribed });
    setOpen(false);
    lastFocus.current?.focus?.();
  };

  // Escape closes; lock page scroll while open; move focus into the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !cfg || hidden) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setState('loading');
    const res = await addNewsletterSubscriberAction(clean);
    if (res.success) {
      setState('done');
      setMessage("You're on the list. Watch your inbox for the offer.");
      if (!preview) writeSeen({ version: cfg.version, at: Date.now(), subscribed: true });
    } else {
      setState('error');
      setMessage(res.message || 'Could not subscribe right now. Please try again.');
    }
  };

  const hasImage = Boolean(cfg.imageUrl);

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-black/55 p-0 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        className={`relative w-full bg-white shadow-2xl max-h-[92dvh] overflow-y-auto grid ${
          hasImage ? 'sm:grid-cols-[5fr_6fr] max-w-[920px]' : 'max-w-[560px]'
        }`}
      >
        <button
          type="button"
          onClick={() => close()}
          aria-label="Close offer"
          className="absolute right-2 top-2 z-10 size-11 flex items-center justify-center bg-white/90 sm:bg-transparent border-none cursor-pointer text-[#0d0d0d] hover:opacity-70"
        >
          <X className="size-6 stroke-[1.5]" aria-hidden />
        </button>

        {hasImage && (
          <div className="relative w-full aspect-[16/10] sm:aspect-auto sm:min-h-[520px] bg-[#f0f0f0] overflow-hidden">
            <SmartImage src={cfg.imageUrl} alt="" fill sizes="(max-width: 639px) 100vw, 420px" className="object-cover object-[50%_20%]" />
          </div>
        )}

        <div className="flex flex-col justify-center text-center px-6 sm:px-[clamp(28px,4vw,56px)] py-8 sm:py-12">
          <h2 id="promo-popup-title" className="t-h3 m-0 uppercase" style={{ fontSize: 'clamp(26px, 3.2vw, 40px)', lineHeight: 1.05 }}>
            {cfg.headline}
          </h2>
          {cfg.body && <p className="t-body mt-4 mb-0 text-[#4a4a4a]">{cfg.body}</p>}

          {state === 'done' ? (
            <div className="mt-8 flex flex-col gap-4">
              <p role="status" className="t-body m-0 text-[#1f7a3a]">{message}</p>
              <button type="button" onClick={() => close(true)} className="lv-btn lv-btn--solid lv-btn--block">
                Continue shopping
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-3">
              <label htmlFor="promo-popup-email" className="sr-only">Email address</label>
              <input
                id="promo-popup-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === 'error') setState('idle');
                }}
                className="w-full h-11 px-4 bg-[#f4f4f4] border border-transparent focus:border-[#0d0d0d] outline-none text-[16px] text-[#0d0d0d] placeholder:text-[#7a7a7a]"
                style={{ fontFamily: "'Overused Grotesk', sans-serif" }}
              />
              <button type="submit" disabled={state === 'loading'} className="lv-btn lv-btn--solid lv-btn--block disabled:opacity-60">
                {state === 'loading' ? 'Joining…' : cfg.buttonLabel}
              </button>
              <p role="status" className="t-small m-0 min-h-[21px] text-[#b42318]">{state === 'error' ? message : ''}</p>
            </form>
          )}

          {cfg.finePrint && <p className="t-small mt-2 mb-0 text-[#7a7a7a]">{cfg.finePrint}</p>}
        </div>
      </div>
    </div>
  );
}
