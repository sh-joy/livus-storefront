'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpVerificationAction } from '@/app/actions/auth-actions';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { KeyRound, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) {
      setErrorMessage('Please enter your registered phone number or email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setMessage('');

    try {
      const res = await sendOtpVerificationAction(emailOrPhone);
      if (res.success) {
        setSentSuccess(true);
        setMessage('A 6-digit password reset code has been sent to your email.');
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(emailOrPhone)}`);
        }, 2500);
      } else {
        setErrorMessage(res.error || 'Failed to send password reset code.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteNav variant="auth" />
      <div className="flex-1 flex items-center justify-center p-6 bg-black">
        <div className="w-full max-w-[440px] bg-[#0d0d0d] border border-neutral-800 p-8 shadow-2xl flex flex-col gap-6 text-white text-center">
          
          {sentSuccess ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="size-14 text-emerald-400" />
              <h2 className="font-display text-3xl font-semibold uppercase tracking-wider text-white">
                Reset Code Sent
              </h2>
              <p className="text-sm font-sans text-neutral-300">
                {message} Redirecting to code verification...
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-2 text-amber-400">
                  <KeyRound className="size-6" />
                </div>
                <h1 className="font-display text-3xl font-semibold uppercase tracking-wider text-white">
                  Reset Password
                </h1>
                <p className="text-sm font-sans text-neutral-400">
                  Enter your phone number or email address below and we will send you a verification code to reset your password.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans text-left">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs uppercase font-sans tracking-wider text-neutral-400">
                    Phone Number or Email
                  </label>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. 01700000000 or user@domain.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 text-white text-sm focus:outline-none focus:border-white transition-colors font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-white text-black text-sm font-medium uppercase tracking-wider hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="size-4 animate-spin text-black" />}
                  <span>{loading ? 'SENDING CODE...' : 'SEND RESET CODE'}</span>
                </button>
              </form>

              <div className="border-t border-neutral-800 pt-4 text-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
