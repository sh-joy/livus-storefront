import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Better Auth uses scrypt/pbkdf2 format or custom hash for passwords.
// We can use Better Auth auth.api.signUpEmail with headers object.
import { auth } from '../lib/auth';

async function seedAdminDirect() {
  const sql = neon(process.env.DATABASE_URL!);
  console.log('🌱 Seeding Superadmin & Admin accounts via Better Auth API...');

  const superadminEmail = 'superadmin@livus.com';
  const superadminPass  = 'SuperAdmin123!';

  const adminEmail      = 'admin@livus.com';
  const adminPass       = 'Admin123!';

  // Clean existing
  await sql`DELETE FROM "session" WHERE "user_id" IN (SELECT id FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "account" WHERE "user_id" IN (SELECT id FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail}))`;
  await sql`DELETE FROM "user" WHERE email IN (${superadminEmail}, ${adminEmail})`;

  // Register Superadmin via auth.api
  try {
    const superRes = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email: superadminEmail,
        password: superadminPass,
        name: 'Super Admin',
      },
    });
    console.log('signUpEmail superRes:', superRes);
    if (superRes?.user?.id) {
      await sql`UPDATE "user" SET role = 'superadmin', "email_verified" = true WHERE id = ${superRes.user.id}`;
      console.log(`✅ Superadmin created: ${superadminEmail} / ${superadminPass}`);
    }
  } catch (err: any) {
    console.error('Error creating superadmin:', err?.message || err);
  }

  // Register Admin via auth.api
  try {
    const adminRes = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email: adminEmail,
        password: adminPass,
        name: 'Regular Admin',
      },
    });
    console.log('signUpEmail adminRes:', adminRes);
    if (adminRes?.user?.id) {
      await sql`UPDATE "user" SET role = 'admin', "email_verified" = true WHERE id = ${adminRes.user.id}`;
      console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
    }
  } catch (err: any) {
    console.error('Error creating admin:', err?.message || err);
  }

  // Wait 1.5s to ensure Drizzle ORM async queries commit to Neon Postgres
  await new Promise((resolve) => setTimeout(resolve, 1500));
  process.exit(0);
}

seedAdminDirect();
