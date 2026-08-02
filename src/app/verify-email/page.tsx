'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOtpCodeAction, sendOtpVerificationAction } from '@/app/actions/auth-actions';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (initialCode) setOtpCode(initialCode);
  }, [emailParam, initialCode]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode) {
      setErrorMessage('Please enter both your email address and 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const res = await verifyOtpCodeAction(email, otpCode);
      if (res.success) {
        setIsVerified(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setErrorMessage('Please provide your email address to resend the code.');
      return;
    }

    setResending(true);
    setErrorMessage('');
    setMessage('');

    try {
      const res = await sendOtpVerificationAction(email);
      if (res.success) {
        setMessage('A new 6-digit verification code has been sent to your email.');
      } else {
        setErrorMessage(res.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] bg-[#0d0d0d] border border-neutral-800 p-8 shadow-2xl flex flex-col gap-6 text-white text-center">
      {isVerified ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <CheckCircle className="size-16 text-emerald-400" />
          <h2 className="font-display text-3xl font-semibold uppercase tracking-wider text-white">
            Email Verified!
          </h2>
          <p className="text-sm font-sans text-neutral-300">
            Your account email has been successfully confirmed. Redirecting to your profile...
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-2 text-white">
              <Mail className="size-6" />
            </div>
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wider text-white">
              Verify Account
            </h1>
            <p className="text-sm font-sans text-neutral-400">
              Please enter the 6-digit verification code sent to{' '}
              <span className="text-white font-medium">{email || 'your email'}</span>.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans text-left">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-sans text-left">
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            {!emailParam && (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs uppercase font-sans tracking-wider text-neutral-400">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-white transition-colors font-sans"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs uppercase font-sans tracking-wider text-neutral-400">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full px-3.5 py-3 bg-black border border-neutral-800 text-white text-center font-mono text-2xl tracking-[8px] focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-white text-black text-sm font-medium uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin text-black" />}
              <span>{loading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}</span>
            </button>
          </form>

          <div className="border-t border-neutral-800 pt-4 flex items-center justify-between text-xs font-sans">
            <span className="text-neutral-400">Didn't receive code?</span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-white underline underline-offset-4 hover:opacity-80 transition-opacity uppercase bg-transparent border-none cursor-pointer"
            >
              {resending ? 'RESENDING...' : 'RESEND CODE'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteNav variant="auth" />
      <div className="flex-1 flex items-center justify-center p-6 bg-black">
        <Suspense fallback={<div className="text-white text-sm font-sans">Loading verification portal...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  );
}
