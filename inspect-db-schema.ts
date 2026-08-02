import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';

async function inspectDbSchema() {
  const sql = neon(process.env.DATABASE_URL!);
  const users = await sql`SELECT * FROM "user"`;
  console.log('Users:', users);
  const accounts = await sql`SELECT * FROM "account"`;
  console.log('Accounts:', accounts);
  process.exit(0);
}

inspectDbSchema();
