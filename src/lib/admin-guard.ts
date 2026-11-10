import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyAdminToken, type AdminSessionPayload } from './admin-session';

export class AdminAuthError extends Error {
  constructor(message = 'Admin authentication required') {
    super(message);
    this.name = 'AdminAuthError';
  }
}

/** Returns the current admin session, or null. Safe to call from server actions and route handlers. */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

/** Throws unless the caller has a valid signed admin session (optionally superadmin). */
export async function requireAdmin(opts?: { superadmin?: boolean }): Promise<AdminSessionPayload> {
  const s = await getAdminSession();
  if (!s) throw new AdminAuthError();
  if (opts?.superadmin && s.role !== 'superadmin') throw new AdminAuthError('Superadmin access required');
  return s;
}
