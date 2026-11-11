/**
 * Server environment validation.
 *
 * Called once at server startup from `src/instrumentation.ts`. In production it
 * throws a single error listing every missing/invalid REQUIRED variable, so a
 * misconfigured Vercel deployment fails loudly (check the Vercel logs) instead
 * of breaking sign-in, admin login or checkout later. Optional-but-recommended
 * variables only produce console warnings.
 *
 * Skipped when:
 *  - NODE_ENV is not "production" (local `npm run dev`)
 *  - CI is set (GitHub Actions build uses dummy http://localhost values)
 *  - during `next build` (NEXT_PHASE = phase-production-build)
 *
 * The https:// rule for the public URLs is enforced only on Vercel Production
 * (VERCEL_ENV === "production"), so Preview deployments and a local
 * `next start` against http://localhost still work.
 */

type Env = Record<string, string | undefined>;

export interface EnvCheckResult {
  /** Problems with required variables. Non-empty => startup must fail. */
  errors: string[];
  /** Recommended-but-optional variables that are missing or half-configured. */
  warnings: string[];
}

const MIN_SECRET_LENGTH = 32;

const isSet = (v: string | undefined): v is string => typeof v === 'string' && v.trim() !== '';

function checkUrl(name: string, value: string, requireHttps: boolean, errors: string[]) {
  try {
    new URL(value);
  } catch {
    errors.push(`${name} is not a valid URL (got "${value}"). Example: https://yourdomain.com`);
    return;
  }
  if (requireHttps && !value.startsWith('https://')) {
    errors.push(`${name} must start with https:// in production (got "${value}").`);
  }
}

/** Pure check — returns problems without throwing or logging. */
export function checkServerEnv(env: Env = process.env): EnvCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requireHttps = env.VERCEL_ENV === 'production';

  // ── Required ────────────────────────────────────────────────
  if (!isSet(env.DATABASE_URL)) {
    errors.push('DATABASE_URL is missing (Neon → Connection string, pooled, with ?sslmode=require).');
  }

  if (!isSet(env.BETTER_AUTH_SECRET)) {
    errors.push('BETTER_AUTH_SECRET is missing (generate one with: openssl rand -base64 32).');
  } else if (env.BETTER_AUTH_SECRET.trim().length < MIN_SECRET_LENGTH) {
    errors.push(
      `BETTER_AUTH_SECRET is too short (${env.BETTER_AUTH_SECRET.trim().length} chars, need at least ${MIN_SECRET_LENGTH}).`,
    );
  }

  const urlVars = ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL'] as const;
  const setUrls = urlVars.filter((n) => isSet(env[n]));
  if (setUrls.length === 0) {
    errors.push('BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be set (your site address, e.g. https://yourdomain.com).');
  }
  for (const name of setUrls) {
    checkUrl(name, env[name]!.trim(), requireHttps, errors);
  }

  // ── Recommended (warn only) ─────────────────────────────────
  const hasBrevoApi = isSet(env.BREVO_API_KEY);
  const hasBrevoSmtp = isSet(env.BREVO_SMTP_USER) && isSet(env.BREVO_SMTP_KEY);
  if (!hasBrevoApi && !hasBrevoSmtp) {
    warnings.push('No Brevo email credentials (BREVO_API_KEY, or BREVO_SMTP_USER + BREVO_SMTP_KEY): order and password-reset emails will NOT be sent.');
  }
  if ((hasBrevoApi || hasBrevoSmtp) && !isSet(env.BREVO_SENDER_EMAIL)) {
    warnings.push('BREVO_SENDER_EMAIL is not set: emails will use a default sender that Brevo may reject. Use an address on your verified domain.');
  }

  if (!isSet(env.BLOB_READ_WRITE_TOKEN)) {
    warnings.push('BLOB_READ_WRITE_TOKEN is not set: admin image uploads will fail on Vercel. Connect a Vercel Blob store to the project.');
  }

  const pairs: Array<[string, string, string]> = [
    ['Google', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    ['Facebook', 'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET'],
    ['Apple', 'APPLE_CLIENT_ID', 'APPLE_CLIENT_SECRET'],
  ];
  for (const [label, id, secret] of pairs) {
    const hasId = isSet(env[id]);
    const hasSecret = isSet(env[secret]);
    if (hasId !== hasSecret) {
      warnings.push(`${label} sign-in is half-configured: ${hasId ? secret : id} is missing (set both ${id} and ${secret}, or neither).`);
    }
  }

  if (!isSet(env.NEXT_PUBLIC_META_PIXEL_ID)) {
    warnings.push('NEXT_PUBLIC_META_PIXEL_ID is not set: Meta Pixel tracking is off.');
  }
  if (!isSet(env.NEXT_PUBLIC_GA_ID)) {
    warnings.push('NEXT_PUBLIC_GA_ID is not set: Google Analytics is off.');
  }

  return { errors, warnings };
}

/**
 * Validate the server environment. Throws one error listing all problems with
 * required variables (production only); logs warnings for optional ones.
 */
export function validateServerEnv(env: Env = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  if (isSet(env.CI)) return;
  if (env.NEXT_PHASE === 'phase-production-build') return;

  const { errors, warnings } = checkServerEnv(env);

  for (const w of warnings) {
    console.warn(`[env] ${w}`);
  }

  if (errors.length > 0) {
    throw new Error(
      [
        `[env] LIVUS cannot start: ${errors.length} required environment variable problem(s).`,
        ...errors.map((e) => `  - ${e}`),
        'Fix these in Vercel → Project → Settings → Environment Variables, then redeploy. See docs/DEPLOYMENT.md.',
      ].join('\n'),
    );
  }
}
