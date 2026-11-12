'use client';

import Script from 'next/script';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  getClientConsent,
  CONSENT_UPDATED_EVENT,
  type ConsentState,
} from '@/lib/cookie-consent';

export function AnalyticsScripts() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  const [consent, setConsent] = useState<ConsentState | null>(null);
  const prevConsentRef = useRef<ConsentState | null>(null);

  // Initialize consent on mount
  useEffect(() => {
    const initial = getClientConsent();
    setConsent(initial);
    prevConsentRef.current = initial;

    const handleConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updated: ConsentState = {
        analytics: Boolean(customEvent.detail?.analytics),
        marketing: Boolean(customEvent.detail?.marketing),
        version: 1,
        timestamp: customEvent.detail?.timestamp || Date.now(),
      };

      const prev = prevConsentRef.current;
      // If user revoked previously granted permission, reload page to cleanly unload scripts
      if (
        (prev?.analytics && !updated.analytics) ||
        (prev?.marketing && !updated.marketing)
      ) {
        window.location.reload();
        return;
      }

      prevConsentRef.current = updated;
      setConsent(updated);
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdated);
    };
  }, []);

  // Track page views on route changes ONLY if consent is given
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (consent?.marketing && (window as any).fbq && pixelId) {
        (window as any).fbq('track', 'PageView');
      }
      if (consent?.analytics && (window as any).gtag && gaId) {
        (window as any).gtag('config', gaId, { page_path: pathname });
      }
    }
  }, [pathname, pixelId, gaId, consent]);

  const hasAnalyticsConsent = Boolean(consent?.analytics);
  const hasMarketingConsent = Boolean(consent?.marketing);

  return (
    <>
      {/* Google Consent Mode v2 Default - Always sets denied before any tracking */}
      <Script id="google-consent-mode-v2" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'analytics_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
        `}
      </Script>

      {/* Google Analytics 4: strictly gated on analytics consent */}
      {gaId && hasAnalyticsConsent && (
        <>
          <Script
            id="gtag-base"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              gtag('consent', 'update', {
                'analytics_storage': 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${gaId}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel: strictly gated on marketing consent */}
      {pixelId && hasMarketingConsent && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
