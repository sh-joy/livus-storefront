'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOtpCodeAction, sendOtpVerificationAction } from '@/app/actions/auth-actions';
import { SiteNav } from '@/figma-components/SiteNav';
import { InputField } from '@/figma-components/InputField';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import signupPhoto from '@/imports/SignUp/147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const { data: session } = useSession();
  useEffect(() => {
    // Which account to verify: the link, else the email saved at sign-up in this browser, else the signed-in account.
    let saved = '';
    try { saved = localStorage.getItem('livus_pending_verify_email') || ''; } catch { /* storage blocked */ }
    const resolved = emailParam || saved || session?.user?.email || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (resolved) setEmail(resolved);
    if (initialCode) setOtpCode(initialCode);
  }, [emailParam, initialCode, session?.user?.email]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanCode = otpCode.trim();

    if (!cleanCode) {
      setErrorMessage('Please enter the 6-digit code we sent you.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please open the link in your verification email, or sign in again to get a new code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await verifyOtpCodeAction(cleanEmail, cleanCode);
      if (res.success) {
        setIsVerified(true);
        try { localStorage.removeItem('livus_pending_verify_email'); } catch { /* ignore */ }
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
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
      setErrorMessage('Please sign in again and we will send you a new code.');
      return;
    }

    setResending(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await sendOtpVerificationAction(email);
      if (res.success) {
        setInfoMessage('A new verification code has been sent to your email.');
      } else {
        setErrorMessage(res.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  if (isVerified) {
    return (
      <div style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "40px 0" }}>
        <CheckCircle className="size-16 text-emerald-400" />
        <h2 style={{
          fontFamily: "'Overused Grotesk', sans-serif",
          fontSize: "42px",
          lineHeight: "48px",
          fontWeight: 600,
          color: "#ffffff",
          letterSpacing: "-0.045em",
          textTransform: "uppercase"
        }}>
          ACCOUNT VERIFIED!
        </h2>
        <p style={{
          fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
          fontSize: "18px",
          color: "#cccccc",
          textAlign: "center"
        }}>
          Your account email has been successfully confirmed. Redirecting to your profile...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Heading + subtitle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p style={{
          fontFamily: "'Overused Grotesk', sans-serif",
          fontSize: "48px", lineHeight: "56px", fontWeight: 600,
          color: "#ffffff", letterSpacing: "-0.045em",
        }}>Verify Code</p>
        <p style={{
          fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
          fontSize: "15px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>
          Enter verification code sent to <strong style={{ color: "#ffffff", fontWeight: 600 }}>{email || "your account email"}</strong>
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans rounded-none">
          {errorMessage}
        </div>
      )}

      {infoMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-sans rounded-none">
          {infoMessage}
        </div>
      )}

      {/* Input fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        <InputField
          label="Verification code"
          type="text"
          value={otpCode}
          onChange={setOtpCode}
          variant="dark"
          autoComplete="one-time-code"
        />
      </div>

      {/* VERIFY & CONTINUE Button matching SignIn / SignUp */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="w-full">
          <button
            type="submit"
            disabled={loading}
            className="lv-btn lv-btn--light lv-btn--block disabled:opacity-60 disabled:cursor-wait"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
            <span>{loading ? "Verifying…" : "Verify & continue"}</span>
          </button>
        </div>
      </div>

      {/* Resend Code Link Row matching SignIn / SignUp footer prompts */}
      <p style={{
        fontFamily: "var(--font-body, 'Overused Grotesk', sans-serif)",
        fontSize: "15px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
        textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span className="text-neutral-400">DIDN'T RECEIVE CODE?</span>
        <span
          className="underline underline-offset-4 cursor-pointer font-medium hover:opacity-80 transition-opacity text-[15px] uppercase text-white"
          onClick={handleResendCode}
        >
          {resending ? "RESENDING..." : "RESEND CODE"}
        </span>
      </p>
    </form>
  );
}

export default function VerifyEmailPage() {
  const imageSrc = typeof signupPhoto === 'string' ? signupPhoto : signupPhoto?.src;

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
      <SiteNav variant="auth" />
      <div style={{ position: "relative", display: "flex", width: "100%", minHeight: "100dvh" }}>
        {/* Left: 1.5 ratio Photo Panel */}
        <div className="max-md:!hidden" style={{
          flex: 1.5,
          minWidth: 0,
          background: "#f0f0f0",
          overflow: "hidden",
          position: "relative",
          minHeight: "600px",
        }}>
          <img
            alt="LIVUS Atelier Verification"
            src={imageSrc}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Right: 1.0 ratio Dark Form Panel */}
        <div className="max-md:!px-[16px] max-md:!py-[80px]" style={{
          flex: 1,
          minWidth: 0,
          background: "#0d0d0d",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 36px",
          boxSizing: "border-box",
        }}>
          <Suspense fallback={<div style={{ color: "#ffffff", fontSize: "14px", fontFamily: "sans-serif" }}>Loading verification portal...</div>}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
