import { headers } from 'next/headers';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding rate limiter per client IP.
 */
export async function checkRateLimit(
  actionKey: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp) || '127.0.0.1';

    const key = `${actionKey}:${ip}`;
    const now = Date.now();
    const record = tracker.get(key);

    if (!record || now > record.resetAt) {
      tracker.set(key, { count: 1, resetAt: now + windowMs });
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
