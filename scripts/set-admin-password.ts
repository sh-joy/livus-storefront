/**
 * Create or update an admin account and set its password (hashed with Better Auth's hasher).
 *
 *   npm run admin:set-password -- <email> <newPassword> [name] [role]
 *
 * role: superadmin (default) | admin. Loads DATABASE_URL etc. from .env.local / .env.
 * The password is never printed. Tip: prefix the command with a space (or clear your shell
 * history afterwards) so the password doesn't stay in your shell history.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usage(msg?: string): never {
  if (msg) console.error(`Error: ${msg}`);
  console.error('Usage: npm run admin:set-password -- <email> <newPassword> [name] [role: superadmin|admin]');
  process.exit(1);
}

async function main() {
  const [rawEmail, password, rawName, rawRole] = process.argv.slice(2);
  if (!rawEmail || !password) usage();

  const email = rawEmail.trim().toLowerCase();
  const role = (rawRole || 'superadmin').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) usage('invalid email address.');
  if (role !== 'superadmin' && role !== 'admin') usage('role must be "superadmin" or "admin".');
  if (!process.env.DATABASE_URL) usage('DATABASE_URL is not set (add it to .env.local).');

  // Imported after dotenv so the DB client sees DATABASE_URL.
  const { auth } = await import('../src/lib/auth');
  const { db } = await import('../src/db/index');
  const { user } = await import('../src/db/schema');
  const { eq } = await import('drizzle-orm');

  const ctx = await auth.$context;
  const min = Math.max(8, ctx.password.config.minPasswordLength || 8);
  const max = ctx.password.config.maxPasswordLength || 128;
  if (password.length < min) usage(`password must be at least ${min} characters.`);
  if (password.length > max) usage(`password must be at most ${max} characters.`);

  const [existing] = await db.select().from(user).where(eq(user.email, email));
  let userId: string;
  let created = false;

  if (existing) {
    userId = existing.id;
    await db
      .update(user)
      .set({
        role,
        emailVerified: true,
        ...(rawName && rawName.trim().length >= 2 ? { name: rawName.trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  } else {
    const name = rawName && rawName.trim().length >= 2 ? rawName.trim() : role === 'superadmin' ? 'Super Admin' : 'Admin';
    const newUser = await ctx.internalAdapter.createUser({ name, email, emailVerified: true, role });
    userId = newUser.id;
    await db.update(user).set({ role }).where(eq(user.id, userId));
    created = true;
  }

  const hash = await ctx.password.hash(password);
  const accounts = await ctx.internalAdapter.findAccounts(userId);
  if (accounts.some((a) => a.providerId === 'credential')) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.createAccount({ userId, providerId: 'credential', accountId: userId, password: hash });
  }
  await ctx.internalAdapter.deleteUserSessions(userId);

  console.log(`${created ? 'Created' : 'Updated'} ${role} ${email}: password set (existing sessions revoked).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to set admin password:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
