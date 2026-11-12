import { describe, it, expect } from 'vitest';
import {
  parseConsentCookie,
  serializeConsentCookie,
  applyGoogleConsentModeV2,
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  CONSENT_MAX_AGE_DAYS,
} from '@/lib/cookie-consent';
import { cookiesPolicyText, POLICY_LAST_UPDATED } from '@/content/policy-defaults';
import { SITE_CONTENT_KEYS, DEFAULT_CONTENT } from '@/content/site-content-defaults';

describe('Cookie Consent Banner & Consent Storage (Agent K)', () => {
  it('serializes choices with correct schema, version, and timestamp', () => {
    const now = Date.now();
    const serialized = serializeConsentCookie({ analytics: true, marketing: false }, now);
    const decoded = JSON.parse(decodeURIComponent(serialized));

    expect(decoded.v).toBe(CONSENT_VERSION);
    expect(decoded.analytics).toBe(true);
    expect(decoded.marketing).toBe(false);
    expect(decoded.ts).toBe(now);
  });

  it('parses valid consent cookie header accurately', () => {
    const now = Date.now();
    const serialized = serializeConsentCookie({ analytics: true, marketing: true }, now);
    const cookieHeader = `other_cookie=123; ${CONSENT_COOKIE_NAME}=${serialized}; session=abc`;

    const parsed = parseConsentCookie(cookieHeader);
    expect(parsed).not.toBeNull();
    expect(parsed?.analytics).toBe(true);
    expect(parsed?.marketing).toBe(true);
    expect(parsed?.version).toBe(CONSENT_VERSION);
    expect(parsed?.timestamp).toBe(now);
  });

  it('returns null when cookie is absent or malformed', () => {
    expect(parseConsentCookie('')).toBeNull();
    expect(parseConsentCookie(null)).toBeNull();
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie('foo=bar; baz=qux')).toBeNull();
    expect(parseConsentCookie(`${CONSENT_COOKIE_NAME}=not-json-content`)).toBeNull();
  });

  it('invalidates consent when schema version mismatches (version bump)', () => {
    const now = Date.now();
    const oldVersionPayload = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION + 1, analytics: true, marketing: true, ts: now })
    );
    const cookieHeader = `${CONSENT_COOKIE_NAME}=${oldVersionPayload}`;

    expect(parseConsentCookie(cookieHeader)).toBeNull();
  });

  it('invalidates consent when expired (> 180 days)', () => {
    const expiredTimestamp = Date.now() - (CONSENT_MAX_AGE_DAYS + 1) * 24 * 60 * 60 * 1000;
    const expiredPayload = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION, analytics: true, marketing: true, ts: expiredTimestamp })
    );
    const cookieHeader = `${CONSENT_COOKIE_NAME}=${expiredPayload}`;

    expect(parseConsentCookie(cookieHeader)).toBeNull();
  });

  it('preserves consent within 180-day window', () => {
    const validTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const validPayload = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION, analytics: false, marketing: false, ts: validTimestamp })
    );
    const cookieHeader = `${CONSENT_COOKIE_NAME}=${validPayload}`;

    const parsed = parseConsentCookie(cookieHeader);
    expect(parsed).not.toBeNull();
    expect(parsed?.analytics).toBe(false);
    expect(parsed?.marketing).toBe(false);
  });

  it('updates cookiesPolicyText with banner details, 3 categories, 6-month expiry, and real cookie list', () => {
    const text = cookiesPolicyText({ storeName: 'LIVUS' });

    expect(text).toContain(POLICY_LAST_UPDATED);
    expect(text).toContain('Cookie consent banner');
    expect(text).toContain('6 months (180 days)');
    expect(text).toContain('Cookie settings');
    expect(text).toContain('livus_consent');
    expect(text).toContain('better-auth.session_token');
    expect(text).toContain('livus_cart');
    expect(text).toContain('_ga');
    expect(text).toContain('_fbp');
    expect(text).toContain('Strictly necessary cookies');
    expect(text).toContain('Analytics cookies');
    expect(text).toContain('Marketing & advertising cookies');
  });

  it('includes cookie_banner_text in site content keys and default content', () => {
    expect(SITE_CONTENT_KEYS).toContain('cookie_banner_text');
    expect(DEFAULT_CONTENT.cookie_banner_text).toContain('Essential cookies');
    expect(DEFAULT_CONTENT.cookie_banner_text).toContain('Cookie settings');
  });

  it('updates Google Consent Mode v2 dataLayer on choice update', () => {
    const globalWin = global as any;
    globalWin.window = global;
    globalWin.dataLayer = [];

    applyGoogleConsentModeV2({ analytics: false, marketing: false });
    expect(globalWin.dataLayer).toHaveLength(1);
    expect(globalWin.dataLayer[0]).toEqual([
      'consent',
      'update',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ]);

    applyGoogleConsentModeV2({ analytics: true, marketing: true });
    expect(globalWin.dataLayer).toHaveLength(2);
    expect(globalWin.dataLayer[1]).toEqual([
      'consent',
      'update',
      {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      },
    ]);
  });
});
