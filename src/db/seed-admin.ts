import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { auth } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

async function seedAdminUsers() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
  }

  const sql = neon(connectionString);

  console.log('🔑 Seeding Superadmin and Admin accounts...');

  const superadminEmail = 'superadmin@livus.com';
  const superadminPass  = 'SuperAdmin123!';

  const adminEmail      = 'admin@livus.com';
  const adminPass       = 'Admin123!';

  // Create Superadmin via Better Auth
  try {
    const existingSuper = await sql`SELECT id FROM "user" WHERE email = ${superadminEmail}`;
    if (existingSuper.length === 0) {
      const userRes = await auth.api.signUpEmail({
        body: {
          email: superadminEmail,
          password: superadminPass,
          name: 'Super Admin',
        },
      });
      if (userRes?.user?.id) {
        await sql`UPDATE "user" SET role = 'superadmin' WHERE id = ${userRes.user.id}`;
        console.log(`✅ Superadmin created: ${superadminEmail} / ${superadminPass}`);
      }
    } else {
      await sql`UPDATE "user" SET role = 'superadmin' WHERE email = ${superadminEmail}`;
      console.log(`ℹ️ Superadmin already exists. Set role = 'superadmin' for ${superadminEmail}`);
    }
  } catch (e: any) {
    console.warn('Note creating superadmin:', e?.message || e);
  }

  // Create Regular Admin via Better Auth
  try {
    const existingAdmin = await sql`SELECT id FROM "user" WHERE email = ${adminEmail}`;
    if (existingAdmin.length === 0) {
      const userRes = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPass,
          name: 'Regular Admin',
        },
      });
      if (userRes?.user?.id) {
        await sql`UPDATE "user" SET role = 'admin' WHERE id = ${userRes.user.id}`;
        console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
      }
    } else {
      await sql`UPDATE "user" SET role = 'admin' WHERE email = ${adminEmail}`;
      console.log(`ℹ️ Admin already exists. Set role = 'admin' for ${adminEmail}`);
    }
  } catch (e: any) {
    console.warn('Note creating admin:', e?.message || e);
  }

  console.log('🎉 Admin accounts ready!');
}

seedAdminUsers().catch(console.error);
