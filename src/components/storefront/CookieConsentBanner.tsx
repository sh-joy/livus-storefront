'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  getClientConsent,
  saveClientConsent,
  OPEN_COOKIE_BANNER_EVENT,
  type ConsentChoices,
} from '@/lib/cookie-consent';
import { getSiteContentAction } from '@/app/actions/site-content';

const DEFAULT_BANNER_TEXT =
  'Essential cookies keep your cart and sign-in working. With your OK, we also use analytics and advertising cookies to improve the shop and show relevant sports styles. You can change your choices any time via Cookie settings in the footer.';

export function CookieConsentBanner() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [bannerText, setBannerText] = useState(DEFAULT_BANNER_TEXT);

  // Manage mode preferences
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  const bannerRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Check consent on mount and listen for reopen events
  useEffect(() => {
    setMounted(true);
    const existing = getClientConsent();
    if (!existing && !isAdmin) {
      setVisible(true);
    }

    // Fetch custom text from admin if set
    getSiteContentAction('cookie_banner_text')
      .then((custom) => {
        if (custom?.trim()) setBannerText(custom.trim());
      })
      .catch(() => {});

    const handleOpenManage = () => {
      const current = getClientConsent();
      if (current) {
        setAnalyticsEnabled(current.analytics);
        setMarketingEnabled(current.marketing);
      }
      setIsManageMode(true);
      setVisible(true);
    };

    window.addEventListener(OPEN_COOKIE_BANNER_EVENT, handleOpenManage);
    return () => {
      window.removeEventListener(OPEN_COOKIE_BANNER_EVENT, handleOpenManage);
    };
  }, [isAdmin]);

  // Focus management & Escape key handling
  useEffect(() => {
    if (!visible) return;

    // Focus first action button when opened
    const timer = setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc closes without saving choice (will show again on next visit)
        setVisible(false);
        setIsManageMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, isManageMode]);

  if (!mounted || !visible || isAdmin) {
    return null;
  }

  const handleDecline = () => {
    saveClientConsent({ analytics: false, marketing: false });
    setVisible(false);
    setIsManageMode(false);
  };

  const handleAcceptAll = () => {
    saveClientConsent({ analytics: true, marketing: true });
    setVisible(false);
    setIsManageMode(false);
  };

  const handleSavePreferences = () => {
    saveClientConsent({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });
    setVisible(false);
    setIsManageMode(false);
  };

  return (
    <aside
      ref={bannerRef}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed z-40 bg-white border border-[var(--lv-line)] shadow-2xl transition-all duration-300
        bottom-0 inset-x-0 md:bottom-5 md:right-5 md:left-auto md:w-full md:max-w-[560px]
        p-5 md:p-6 pb-[max(20px,env(safe-area-inset-bottom))]"
      style={{ fontFamily: "'Overused Grotesk', sans-serif" }}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <h2
            id="cookie-banner-title"
            className="t-eyebrow text-[#0d0d0d] uppercase m-0 tracking-[0.14em] font-semibold text-[15px]"
          >
            {isManageMode ? 'Cookie Preferences' : 'We use cookies'}
          </h2>
          {isManageMode && (
            <button
              type="button"
              onClick={() => setIsManageMode(false)}
              className="text-[13px] text-[#555] hover:text-black underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
            >
              Back
            </button>
          )}
        </div>

        {/* Body content */}
        {!isManageMode ? (
          <>
            <p id="cookie-banner-desc" className="t-body m-0 text-[#4a4a4a] text-[15px] leading-relaxed">
              {bannerText}{' '}
              <Link
                href="/cookies"
                className="underline underline-offset-4 text-[#0d0d0d] hover:text-black font-medium"
              >
                Cookie Policy
              </Link>
              .
            </p>

            {/* Actions: Decline & Accept all with equal prominence, plus Manage */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  ref={firstButtonRef}
                  type="button"
                  onClick={handleDecline}
                  className="lv-btn lv-btn--outline w-full !h-11 !text-[14px] !font-medium tracking-wide uppercase"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="lv-btn lv-btn--solid w-full !h-11 !text-[14px] !font-medium tracking-wide uppercase"
                >
                  Accept all
                </button>
              </div>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsManageMode(true)}
                  className="text-[13px] text-[#666] hover:text-[#0d0d0d] underline underline-offset-4 bg-transparent border-none p-1 cursor-pointer font-medium"
                >
                  Manage preferences
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Manage Mode: Granular Category Toggles */
          <div className="flex flex-col gap-4">
            <p id="cookie-banner-desc" className="t-small m-0 text-[#555] leading-normal">
              Manage which cookies you allow. Essential cookies are required to operate the cart and authentication.
            </p>

            <div className="flex flex-col divide-y divide-[var(--lv-line)] border-y border-[var(--lv-line)] py-1">
              {/* Essential Cookies (Always On) */}
              <div className="flex items-center justify-between py-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0d0d0d]">Essential Cookies</span>
                  <span className="text-[12px] text-[#666]">
                    Required for cart, secure checkout, session sign-in, and security.
                  </span>
                </div>
                <span className="text-[12px] font-mono text-[#888] uppercase bg-neutral-100 px-2 py-1 shrink-0">
                  Always on
                </span>
              </div>

              {/* Analytics Cookies */}
              <label className="flex items-center justify-between py-3 gap-4 cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0d0d0d]">Analytics Cookies</span>
                  <span className="text-[12px] text-[#666]">
                    Help us understand how visitors train, browse, and navigate our store (Google Analytics 4).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="size-5 accent-[#0d0d0d] cursor-pointer shrink-0"
                />
              </label>

              {/* Marketing Cookies */}
              <label className="flex items-center justify-between py-3 gap-4 cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0d0d0d]">Marketing &amp; Advertising</span>
                  <span className="text-[12px] text-[#666]">
                    Help us deliver relevant sportswear drops and measure campaign performance (Meta Pixel).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  className="size-5 accent-[#0d0d0d] cursor-pointer shrink-0"
                />
              </label>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                ref={firstButtonRef}
                type="button"
                onClick={handleSavePreferences}
                className="lv-btn lv-btn--solid w-full sm:w-auto sm:min-w-[160px] !h-11 !text-[14px] !font-medium tracking-wide uppercase"
              >
                Save choices
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
