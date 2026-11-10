import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed admin session cookie.
 * Value = base64url(JSON payload) + "." + HMAC-SHA256 signature, keyed by BETTER_AUTH_SECRET.
 * It is set httpOnly by the server, so browser scripts can't read or forge it.
 */
export const ADMIN_COOKIE = 'livus_admin_token';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AdminSessionPayload {
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  exp: number; // unix seconds
}

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BETTER_AUTH_SECRET must be set in production');
    }
    return 'dev-only-insecure-admin-secret';
  }
  return s;
}

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(data: string): string {
  return b64url(createHmac('sha256', secret()).update(data).digest());
}

export function createAdminToken(p: Omit<AdminSessionPayload, 'exp'>): string {
  const payload: AdminSessionPayload = { ...p, exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  return `${data}.${sign(data)}`;
}

export function verifyAdminToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== 'admin' && payload.role !== 'superadmin') return null;
    return payload;
  } catch {
    return null;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
