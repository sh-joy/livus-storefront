/**
 * Cookie consent model and storage for LIVUS.
 * Stores user preferences in a first-party cookie 'livus_consent' with 180-day (6-month) expiry.
 */

export const CONSENT_COOKIE_NAME = 'livus_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 180;
export const CONSENT_MAX_AGE_SECONDS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;

export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
}

export interface StoredConsentPayload {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: number;
}

export interface ConsentState extends ConsentChoices {
  version: number;
  timestamp: number;
}

export const CONSENT_UPDATED_EVENT = 'livus:consent-updated';
export const OPEN_COOKIE_BANNER_EVENT = 'livus:open-cookie-banner';

/** Parse consent from a raw cookie string (e.g. document.cookie or header). */
export function parseConsentCookie(cookieHeader: string | null | undefined): ConsentState | null {
  if (!cookieHeader) return null;

  try {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === CONSENT_COOKIE_NAME) {
        const rawValue = decodeURIComponent(rest.join('='));
        const parsed = JSON.parse(rawValue) as StoredConsentPayload;

        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          parsed.v === CONSENT_VERSION &&
          typeof parsed.analytics === 'boolean' &&
          typeof parsed.marketing === 'boolean' &&
          typeof parsed.ts === 'number'
        ) {
          // Check 180-day expiration
          const ageMs = Date.now() - parsed.ts;
          const maxAgeMs = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
          if (ageMs >= 0 && ageMs < maxAgeMs) {
            return {
              analytics: parsed.analytics,
              marketing: parsed.marketing,
              version: parsed.v,
              timestamp: parsed.ts,
            };
          }
        }
        return null;
      }
    }
  } catch {
    // Malformed JSON or unparseable cookie -> re-prompt
    return null;
  }

  return null;
}

/** Serialize consent state into a cookie value. */
export function serializeConsentCookie(choices: ConsentChoices, timestamp: number = Date.now()): string {
  const payload: StoredConsentPayload = {
    v: CONSENT_VERSION,
    analytics: Boolean(choices.analytics),
    marketing: Boolean(choices.marketing),
    ts: timestamp,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

/** Get consent in browser environment. */
export function getClientConsent(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  try {
    return parseConsentCookie(document.cookie);
  } catch {
    return null;
  }
}

/** Check if user has already made a valid consent choice. */
export function hasConsentBeenDecided(): boolean {
  return getClientConsent() !== null;
}

/** Update Google Consent Mode v2 in the browser. */
export function applyGoogleConsentModeV2(choices: ConsentChoices) {
  if (typeof window === 'undefined') return;
  try {
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    function gtag(...args: any[]) {
      win.dataLayer.push(args);
    }
    if (!win.gtag) win.gtag = gtag;

    win.gtag('consent', 'update', {
      analytics_storage: choices.analytics ? 'granted' : 'denied',
      ad_storage: choices.marketing ? 'granted' : 'denied',
      ad_user_data: choices.marketing ? 'granted' : 'denied',
      ad_personalization: choices.marketing ? 'granted' : 'denied',
    });
  } catch {
    /* ignore in non-browser or blocked environments */
  }
}

/** Save consent choices to first-party cookie, apply consent mode, and dispatch update event. */
export function saveClientConsent(choices: ConsentChoices): ConsentState {
  const now = Date.now();
  const serialized = serializeConsentCookie(choices, now);

  if (typeof document !== 'undefined') {
    try {
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      document.cookie = `${CONSENT_COOKIE_NAME}=${serialized}; max-age=${CONSENT_MAX_AGE_SECONDS}; path=/; SameSite=Lax${
        isSecure ? '; Secure' : ''
      }`;
    } catch {
      /* cookies may be disabled or blocked */
    }

    applyGoogleConsentModeV2(choices);

    try {
      window.dispatchEvent(
        new CustomEvent(CONSENT_UPDATED_EVENT, {
          detail: { analytics: choices.analytics, marketing: choices.marketing, timestamp: now },
        })
      );
    } catch {
      /* CustomEvent fallback */
    }
  }

  return {
    analytics: choices.analytics,
    marketing: choices.marketing,
    version: CONSENT_VERSION,
    timestamp: now,
  };
}

/** Programmatically open the cookie consent banner in Manage mode. */
export function openCookieConsentBanner() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_BANNER_EVENT));
  } catch {
    /* ignore */
  }
}
