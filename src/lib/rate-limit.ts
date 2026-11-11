import { headers } from 'next/headers';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const inMemoryFallback = new Map<string, RateLimitRecord>();

/**
 * Resilient sliding rate limiter per client IP.
 * Uses PostgreSQL rate_limits table so it holds up across Vercel serverless instances.
 */
export async function checkRateLimit(
  actionKey: string,
  maxRequests: number = 10,
  windowMs: number = 60000,
  customIdentifier?: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    const headerList = await headers();
    // Vercel edge/proxy headers cannot be spoofed by client
    const vercelIp = headerList.get('x-vercel-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    const forwarded = headerList.get('x-forwarded-for');
    const ip = vercelIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1');

    const identifier = customIdentifier ? customIdentifier.trim().toLowerCase() : ip;
    const key = `${actionKey}:${identifier}`;
    const now = new Date();
    const resetAt = new Date(Date.now() + windowMs);

    if (db) {
      try {
        const result: any = await db.execute(sql`
          INSERT INTO rate_limits (key, count, reset_at)
          VALUES (${key}, 1, ${resetAt})
          ON CONFLICT (key) DO UPDATE
          SET count = CASE
            WHEN rate_limits.reset_at < ${now} THEN 1
            ELSE rate_limits.count + 1
          END,
          reset_at = CASE
            WHEN rate_limits.reset_at < ${now} THEN ${resetAt}
            ELSE rate_limits.reset_at
          END
          RETURNING count;
        `);

        const currentCount = Number(result.rows?.[0]?.count ?? 1);
        if (currentCount > maxRequests) {
          return { success: false, remaining: 0 };
        }
        return { success: true, remaining: Math.max(0, maxRequests - currentCount) };
      } catch (dbErr) {
        console.warn('Postgres rate_limits fallback to memory:', dbErr);
      }
    }

    // In-memory fallback
    const nowMs = Date.now();
    const record = inMemoryFallback.get(key);
    if (!record || nowMs > record.resetAt) {
      inMemoryFallback.set(key, { count: 1, resetAt: nowMs + windowMs });
      return { success: true, remaining: maxRequests - 1 };
    }
    if (record.count >= maxRequests) {
      return { success: false, remaining: 0 };
    }
    record.count += 1;
    return { success: true, remaining: maxRequests - record.count };
  } catch {
    return { success: true, remaining: 1 };
  }
}
