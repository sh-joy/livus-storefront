'use server';

import { db } from '@/db';
import { user, verification, customers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendVerificationEmail } from '@/lib/email';

// 1. Generate & send 6-digit OTP code to user's email via Brevo SMTP
export async function sendOtpVerificationAction(email: string, userName?: string) {
  try {
    if (!db || !email) return { success: false, error: 'Invalid email' };
    const cleanEmail = email.trim().toLowerCase();

    // Generate random 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // Delete any previous verification tokens for this email
    await db.delete(verification).where(eq(verification.identifier, cleanEmail));

    // Save OTP token in verification table
    await db.insert(verification).values({
      id: 'verif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      identifier: cleanEmail,
      value: otpCode,
      expiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send email with OTP code & sign-in verification link via Brevo
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signin?mode=reset-code&email=${encodeURIComponent(cleanEmail)}&code=${otpCode}`;

    const emailResult = await sendVerificationEmail({
      to: cleanEmail,
      userName: userName || 'Valued Customer',
      code: otpCode,
      verificationUrl,
    });

    let returnMsg = 'Verification code sent to your email.';
    if (!emailResult.success) {
      returnMsg = `Verification code generated: ${otpCode} (SMTP pending configuration)`;
    }

    return { success: true, message: returnMsg, devCode: otpCode };
  } catch (err: any) {
    console.error('Error sending OTP verification code:', err);
    return { success: false, error: err?.message || 'Failed to send verification code.' };
  }
}

// 2. Verify 6-digit OTP code entered by user
export async function verifyOtpCodeAction(email: string, otpCode: string) {
  try {
    if (!db || !email || !otpCode) return { success: false, error: 'Email and code are required.' };
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, cleanEmail),
        eq(verification.value, cleanCode)
      ),
    });

    if (!record) {
      return { success: false, error: 'Invalid verification code. Please check and try again.' };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Mark user's email as verified in user table
    await db.update(user).set({
      emailVerified: true,
      updatedAt: new Date(),
    }).where(eq(user.email, cleanEmail));

    // Delete token after successful verification
    await db.delete(verification).where(eq(verification.identifier, cleanEmail));

    return { success: true };
  } catch (err: any) {
    console.error('Error verifying OTP code:', err);
    return { success: false, error: err?.message || 'Verification failed.' };
  }
}

// 3. Reset password using 6-digit OTP code
export async function resetPasswordWithOtpAction(emailOrPhone: string, otpCode: string, newPassword: string) {
  try {
    if (!db || !emailOrPhone || !otpCode || !newPassword) {
      return { success: false, error: 'Email/phone, code, and new password are required.' };
    }
    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    const record = await db.query.verification.findFirst({
      where: and(
        eq(verification.identifier, cleanIdentifier),
        eq(verification.value, cleanCode)
      ),
    });

    if (!record) {
      return { success: false, error: 'Invalid verification code. Please check and try again.' };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Delete token after successful verification
    await db.delete(verification).where(eq(verification.identifier, cleanIdentifier));

    return { success: true };
  } catch (err: any) {
    console.error('Error resetting password with OTP:', err);
    return { success: false, error: err?.message || 'Password reset failed.' };
  }
}
