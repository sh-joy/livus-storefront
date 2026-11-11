import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { ADMIN_COOKIE, verifyAdminToken, type AdminSessionPayload } from './admin-session';

export class AdminAuthError extends Error {
  constructor(message = 'Admin authentication required') {
    super(message);
    this.name = 'AdminAuthError';
  }
}

/**
 * Returns the current admin session, or null. Safe to call from server actions and route handlers.
 *
 * The signed cookie proves who signed in; the database decides whether they are STILL an admin.
 * So deleting or demoting an admin takes effect immediately instead of when their 7-day cookie expires,
 * and a demoted superadmin loses superadmin rights right away.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
  if (!token) return null;

  try {
    const { db } = await import('@/db');
    const { user } = await import('@/db/schema');
    const row = await db.query.user.findFirst({
      where: eq(user.email, token.email.toLowerCase()),
      columns: { role: true, name: true },
    });
    if (row) {
      if (row.role !== 'admin' && row.role !== 'superadmin') return null;
      return { ...token, role: row.role, name: row.name || token.name };
    }
  } catch (err) {
    console.error('Admin session database check failed:', err);
    return null;
  }

  // No database account: only allowed in local development, and only for admins listed in
  // the local .admin-credentials.json file. Production admins must exist in the database.
  if (process.env.NODE_ENV === 'production') return null;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const file = path.join(process.cwd(), '.admin-credentials.json');
    const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [];
    const listed = Array.isArray(list) && list.some((u: { email?: string }) => (u.email || '').toLowerCase() === token.email.toLowerCase());
    return listed ? token : null;
  } catch {
    return null;
  }
}

/** Throws unless the caller has a valid signed admin session (optionally superadmin). */
export async function requireAdmin(opts?: { superadmin?: boolean }): Promise<AdminSessionPayload> {
  const s = await getAdminSession();
  if (!s) throw new AdminAuthError();
  if (opts?.superadmin && s.role !== 'superadmin') throw new AdminAuthError('Superadmin access required');
  return s;
}
