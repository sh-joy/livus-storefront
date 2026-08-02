import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { db } from './src/db';
import { user } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function debugBetterAuth() {
  console.log('Querying user via Drizzle db...');
  if (!db) {
    console.error('db is null!');
    process.exit(1);
  }

  const superUser = await db.query.user.findFirst({
    where: eq(user.email, 'superadmin@livus.com'),
  });

  console.log('Drizzle query result for superadmin@livus.com:', superUser);
  process.exit(0);
}

debugBetterAuth();
