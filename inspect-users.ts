import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';

async function inspectUsers() {
  const sql = neon(process.env.DATABASE_URL!);
  const users = await sql`SELECT id, name, email, role FROM "user"`;
  console.log('Users in DB:', users);
  const accounts = await sql`SELECT id, "userId", provider_id FROM "account"`;
  console.log('Accounts in DB:', accounts);
  process.exit(0);
}

inspectUsers();
