import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { auth } from '../lib/auth';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

async function resetAdminCredentials() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
  }

  const sql = neon(connectionString);
  console.log('🔑 Resetting Superadmin & Admin credentials...');

  const superadminEmail = 'superadmin@livus.com';
  const superadminPass  = 'SuperAdmin123!';

  const adminEmail      = 'admin@livus.com';
  const adminPass       = 'Admin123!';

  // Clean existing test users to ensure fresh password hashing
  await sql`DELETE FROM "session" WHERE "user_id" IN (SELECT id FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "account" WHERE "user_id" IN (SELECT id FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail})`;

  // Register Superadmin
  try {
    const superRes = await auth.api.signUpEmail({
      body: {
        email: superadminEmail,
        password: superadminPass,
        name: 'Super Admin',
      },
    });
    if (superRes?.user?.id) {
      await sql`UPDATE "user" SET role = 'superadmin', "email_verified" = true WHERE id = ${superRes.user.id}`;
      console.log(`✅ Superadmin created successfully: ${superadminEmail} / ${superadminPass}`);
    }
  } catch (e: any) {
    console.error('Superadmin creation error:', e?.message || e);
  }

  // Register Regular Admin
  try {
    const adminRes = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPass,
        name: 'Regular Admin',
      },
    });
    if (adminRes?.user?.id) {
      await sql`UPDATE "user" SET role = 'admin', "email_verified" = true WHERE id = ${adminRes.user.id}`;
      console.log(`✅ Regular Admin created successfully: ${adminEmail} / ${adminPass}`);
    }
  } catch (e: any) {
    console.error('Admin creation error:', e?.message || e);
  }

  process.exit(0);
}

resetAdminCredentials();
