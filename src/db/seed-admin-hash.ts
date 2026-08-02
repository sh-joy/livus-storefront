import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import { auth } from '../lib/auth';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function seedAdminHash() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log('🔑 Seeding Superadmin & Admin directly with hashed passwords...');

  const superEmail = 'superadmin@livus.com';
  const superPass  = 'SuperAdmin123!';
  const superId    = 'superadmin-user-id-001';
  const superAccId = 'superadmin-account-id-001';

  const adminEmail = 'admin@livus.com';
  const adminPass  = 'Admin123!';
  const adminId    = 'admin-user-id-002';
  const adminAccId = 'admin-account-id-002';

  // Clean existing
  await sql`DELETE FROM "session" WHERE "user_id" IN (${superId}, ${adminId}) OR "user_id" IN (SELECT id FROM "user" WHERE email IN (${superEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "account" WHERE "user_id" IN (${superId}, ${adminId}) OR "user_id" IN (SELECT id FROM "user" WHERE email IN (${superEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "user" WHERE email IN (${superEmail}, ${adminEmail})`;

  const now = new Date();

  // 1. Insert Superadmin User
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, image, role, created_at, updated_at)
    VALUES (${superId}, 'Super Admin', ${superEmail}, true, null, 'superadmin', ${now}, ${now})
  `;
  // Insert Superadmin Account
  await sql`
    INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES (${superAccId}, ${superId}, 'credential', ${superId}, ${hashPassword(superPass)}, ${now}, ${now})
  `;
  console.log(`✅ Superadmin row inserted: ${superEmail} / ${superPass}`);

  // 2. Insert Regular Admin User
  await sql`
    INSERT INTO "user" (id, name, email, email_verified, image, role, created_at, updated_at)
    VALUES (${adminId}, 'Regular Admin', ${adminEmail}, true, null, 'admin', ${now}, ${now})
  `;
  // Insert Regular Admin Account
  await sql`
    INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES (${adminAccId}, ${adminId}, 'credential', ${adminId}, ${hashPassword(adminPass)}, ${now}, ${now})
  `;
  console.log(`✅ Regular Admin row inserted: ${adminEmail} / ${adminPass}`);

  // Test sign in using Better Auth API
  console.log('Testing authentication via auth.api.signInEmail...');

  try {
    const res = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: superEmail, password: superPass },
    });
    console.log('🎉 Superadmin auth test successful! Email:', res?.user?.email, 'Role:', (res?.user as any)?.role);
  } catch (err: any) {
    console.error('❌ Superadmin auth test failed:', err?.message || err);
  }

  try {
    const res2 = await auth.api.signInEmail({
      headers: new Headers(),
      body: { email: adminEmail, password: adminPass },
    });
    console.log('🎉 Admin auth test successful! Email:', res2?.user?.email, 'Role:', (res2?.user as any)?.role);
  } catch (err2: any) {
    console.error('❌ Admin auth test failed:', err2?.message || err2);
  }

  process.exit(0);
}

seedAdminHash();
