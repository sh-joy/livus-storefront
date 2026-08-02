import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

async function migrateAuth() {
  if (!connectionString) {
    console.error('❌ DATABASE_URL missing');
    process.exit(1);
  }

  const sql = neon(connectionString);
  console.log('🚀 Ensuring Better Auth tables exist in Neon Postgres...');

  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
      "image" TEXT,
      "role" TEXT NOT NULL DEFAULT 'user',
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expires_at" TIMESTAMP NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "ip_address" TEXT,
      "user_agent" TEXT,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" TIMESTAMP,
      "refresh_token_expires_at" TIMESTAMP,
      "scope" TEXT,
      "password" TEXT,
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expires_at" TIMESTAMP NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );
  `;

  console.log('✅ Better Auth tables created/verified successfully!');
}

migrateAuth().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
