'use server';

import { randomInt } from 'crypto';
import { db } from '@/db';
import { user, verification, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Attempt counters are stored as separate verification rows so no schema change is needed.
const attemptKey = (email: string) => `otp-attempts:${email}`;

async function getAttempts(email: string): Promise<number> {
  const row = await db.query.verification.findFirst({ where: eq(verification.identifier, attemptKey(email)) });
  if (!row || new Date() > row.expiresAt) return 0;
  return parseInt(row.value, 10) || 0;
}

async function bumpAttempts(email: string, current: number) {
  await db.delete(verification).where(eq(verification.identifier, attemptKey(email)));
  await db.insert(verification).values({
    id: `otp-att-${Date.now()}-${randomInt(1e9)}`,
    identifier: attemptKey(email),
    value: String(current + 1),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });
}

async function clearOtp(email: string) {
  await db.delete(verification).where(eq(verification.identifier, email));
  await db.delete(verification).where(eq(verification.identifier, attemptKey(email)));
}

/**
 * Checks a 6-digit code for an email. Locks out after OTP_MAX_ATTEMPTS wrong guesses
 * so the 1,000,000-code space can't be brute-forced.
 */
async function checkOtp(email: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const attempts = await getAttempts(email);
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const record = await db.query.verification.findFirst({ where: eq(verification.identifier, email) });
  if (!record || record.value !== code) {
    if (record) await bumpAttempts(email, attempts);
    return { ok: false, error: 'Invalid verification code. Please check and try again.' };
  }
  if (new Date() > record.expiresAt) {
    return { ok: false, error: 'Verification code has expired. Please request a new code.' };
  }
  return { ok: true };
}

// 1. Generate & email a 6-digit OTP code via Brevo SMTP.
//    The code is NEVER returned to the browser — it is only delivered by email.
export async function sendOtpVerificationAction(email: string, userName?: string) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!db || !EMAIL_RE.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Rate limit: 3 requests per 10 minutes per IP and per email
    const ipRate = await checkRateLimit('send_otp_ip', 3, 10 * 60 * 1000);
    if (!ipRate.success) {
      return { success: false, error: 'Too many verification requests from your device. Please wait 10 minutes.' };
    }
    const emailRate = await checkRateLimit('send_otp_email', 3, 10 * 60 * 1000, cleanEmail);
    if (!emailRate.success) {
      return { success: false, error: 'Too many verification requests for this email address. Please wait 10 minutes.' };
    }

    // Resend cooldown
    const existing = await db.query.verification.findFirst({ where: eq(verification.identifier, cleanEmail) });
    if (existing?.createdAt && Date.now() - new Date(existing.createdAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
      return { success: false, error: 'Please wait a few seconds before requesting another code.' };
    }

    const otpCode = randomInt(100000, 1000000).toString();
    await clearOtp(cleanEmail);
    await db.insert(verification).values({
      id: `verif-${Date.now()}-${randomInt(1e9)}`,
      identifier: cleanEmail,
      value: otpCode,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin?mode=reset-code&email=${encodeURIComponent(cleanEmail)}&code=${otpCode}`;

    const emailResult = await sendVerificationEmail({
      to: cleanEmail,
      userName: userName || 'Valued Customer',
      code: otpCode,
      verificationUrl,
    });

    if (!emailResult.success) {
      if (process.env.NODE_ENV !== 'production') {
        // Local development only: lets you test without working SMTP. Printed in the server terminal, never sent to the browser.
        console.info(`[dev] OTP for ${cleanEmail}: ${otpCode}`);
      }
      return { success: false, error: 'We could not send the email right now. Please try again shortly.' };
    }

    return { success: true, message: 'Verification code sent to your email.' };
  } catch (err) {
    console.error('Error sending OTP verification code:', err);
    return { success: false, error: 'Failed to send verification code.' };
  }
}

// 2. Verify a 6-digit OTP code and mark the email as verified.
export async function verifyOtpCodeAction(email: string, otpCode: string) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (otpCode || '').trim();
    if (!db || !cleanEmail || !cleanCode) return { success: false, error: 'Email and code are required.' };

    const result = await checkOtp(cleanEmail, cleanCode);
    if (!result.ok) return { success: false, error: result.error };

    await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.email, cleanEmail));
    await clearOtp(cleanEmail);
    return { success: true };
  } catch (err) {
    console.error('Error verifying OTP code:', err);
    return { success: false, error: 'Verification failed.' };
  }
}

// 3. Reset password using a 6-digit OTP code. Actually updates the stored (hashed) password.
export async function resetPasswordWithOtpAction(emailInput: string, otpCode: string, newPassword: string) {
  try {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const cleanCode = (otpCode || '').trim();
    if (!db || !cleanEmail || !cleanCode || !newPassword) {
      return { success: false, error: 'Email, code, and new password are required.' };
    }

    const ctx = await auth.$context;
    const { minPasswordLength, maxPasswordLength } = ctx.password.config;
    if (newPassword.length < minPasswordLength) {
      return { success: false, error: `Password must be at least ${minPasswordLength} characters.` };
    }
    if (newPassword.length > maxPasswordLength) {
      return { success: false, error: 'Password is too long.' };
    }

    const result = await checkOtp(cleanEmail, cleanCode);
    if (!result.ok) return { success: false, error: result.error };

    const authUser = await db.query.user.findFirst({ where: eq(user.email, cleanEmail) });
    if (!authUser) {
      return { success: false, error: 'No account found for this email.' };
    }

    const hashed = await ctx.password.hash(newPassword);
    const accounts = await ctx.internalAdapter.findAccounts(authUser.id);
    if (accounts.find((a) => a.providerId === 'credential')) {
      await ctx.internalAdapter.updatePassword(authUser.id, hashed);
    } else {
      await ctx.internalAdapter.createAccount({
        userId: authUser.id,
        providerId: 'credential',
        accountId: authUser.id,
        password: hashed,
      });
    }

    // Proving inbox ownership also verifies the email; sign out other devices.
    if (!authUser.emailVerified) {
      await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, authUser.id));
    }
    await ctx.internalAdapter.deleteUserSessions(authUser.id);
    await clearOtp(cleanEmail);

    return { success: true };
  } catch (err) {
    console.error('Error resetting password with OTP:', err);
    return { success: false, error: 'Password reset failed.' };
  }
}

// 4. Create or update the customer CRM record for the signed-in user after registration.
export async function registerCustomerRecordAction(fullName: string, email: string, phone?: string) {
  try {
    if (!db || !email) return { success: false, error: 'Email is required' };
    const cleanEmail = email.trim().toLowerCase();

    // Only allow syncing the record for the account that is actually signed in.
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.email.toLowerCase() !== cleanEmail) {
      return { success: false, error: 'Not authorized' };
    }

    const cleanName = (fullName || '').trim() || session.user.name || 'Valued Customer';
    const cleanPhone = (phone || '').trim().replace(/[\s-]/g, '');

    const existing = await db.query.customers.findFirst({ where: eq(customers.email, cleanEmail) });

    if (existing) {
      await db.update(customers).set({
        fullName: cleanName,
        updatedAt: new Date(),
      }).where(eq(customers.id, existing.id));
    } else if (cleanPhone) {
      // customers.phone is required + unique. If this phone already belongs to a (guest) record, attach the email to it.
      const byPhone = await db.query.customers.findFirst({ where: eq(customers.phone, cleanPhone) });
      if (byPhone) {
        await db.update(customers).set({
          email: byPhone.email || cleanEmail,
          fullName: cleanName,
          updatedAt: new Date(),
        }).where(eq(customers.id, byPhone.id));
      } else {
        await db.insert(customers).values({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          totalOrdersCount: 0,
          totalSpentBdt: 0,
        });
      }
    }
    // No phone yet: the CRM record gets created on first checkout or profile save (phone is mandatory there).

    revalidatePath('/admin/customers');
    return { success: true };
  } catch (err) {
    console.error('Error registering customer record:', err);
    return { success: false, error: 'Failed to sync customer record' };
  }
}
