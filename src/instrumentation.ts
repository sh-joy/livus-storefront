/**
 * Next.js instrumentation hook — `register()` runs once when a server instance starts.
 * We use it to validate environment variables so a misconfigured deployment fails
 * immediately with a clear message in the Vercel logs (see src/lib/env.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateServerEnv } = await import('./lib/env');
    validateServerEnv();
  }
}
