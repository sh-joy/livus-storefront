import crypto from 'crypto';

const SECRET = process.env.BETTER_AUTH_SECRET || 'livus-secure-signing-salt-2026';

export function signOrderConfirmationToken(orderNumber: string, phone: string): string {
  const ts = Date.now().toString();
  const raw = `${orderNumber}|${phone}|${ts}`;
  const hmac = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  return `${raw}|${hmac}`;
}

export function verifyOrderConfirmationToken(
  token: string,
  targetOrderNumber: string
): { valid: boolean; phone?: string } {
  try {
    if (!token) return { valid: false };
    const parts = token.split('|');
    if (parts.length !== 4) return { valid: false };
    const [ordNum, phone, tsStr, signature] = parts;
    if (ordNum !== targetOrderNumber) return { valid: false };

    const raw = `${ordNum}|${phone}|${tsStr}`;
    const expected = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return { valid: false };
    }

    const ts = parseInt(tsStr, 10);
    // Token valid for 30 minutes
    if (Date.now() - ts > 30 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, phone };
  } catch {
    return { valid: false };
  }
}
