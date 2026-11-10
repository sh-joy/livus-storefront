import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// The connection string must come from the environment (.env.local locally, Vercel env vars in production).
// Never hard-code credentials here — this file is committed to git.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (local) or your Vercel project settings.');
}

export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export { schema };
