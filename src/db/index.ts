import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_1Z9OqrpsdtSW@ep-wild-paper-azd96lli-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Export neon client and drizzle db instance
export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export { schema };
