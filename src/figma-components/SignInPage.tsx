import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { authClient } from "@/lib/auth-client";
import { sendOtpVerificationAction, resetPasswordWithOtpAction } from "@/app/actions/auth-actions";
import { Loader2, Eye, EyeOff } from "lucide-react";
import signinPhoto from "@/imports/SignIn/147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";

// 6-Digit Individual Box Input Component
function Otp6DigitBoxes({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const digits = (value || "").padEnd(6, "").split("").slice(0, 6);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    const clean = char.replace(/\D/g, "");
    if (!clean && char !== "") return;

    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    const combined = newDigits.join("");
    onChange(combined);

    // Auto-focus next box if digit entered
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasteData) {
      onChange(pasteData);
      const nextIndex = Math.min(pasteData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2.5 w-full my-2">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[idx] || ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="w-12 h-13 bg-[#181818] border border-neutral-700 text-white font-mono text-xl text-center focus:outline-none focus:border-amber-400 transition-colors rounded-none"
        />
      ))}
    </div>
  );
}

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Inline mode state: "signin" | "reset-request" | "reset-code"
  const [authMode, setAuthMode] = useState<"signin" | "reset-request" | "reset-code">("signin");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password Visibility Toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const urlMode = searchParams?.get("mode");
    const urlEmail = searchParams?.get("email");
    const urlCode = searchParams?.get("code");
    const urlError = searchParams?.get("error");

    if (urlError) {
      if (urlError === "access_denied") {
        setErrorMessage("Authentication cancelled. Returned to sign in.");
      } else {
        setErrorMessage(`Authentication error: ${urlError}`);
      }
    } else if (urlMode === "reset-code" || urlCode) {
      setAuthMode("reset-code");
      if (urlEmail) setResetIdentifier(urlEmail);
      if (urlCode) setOtpCode(urlCode);
      setInfoMessage("Verification code loaded from link. Please set your new password.");
    }
  }, [searchParams]);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const res = await authClient.signIn.email({
        email: email.trim(),
        password: password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid email or password.");
      } else {
        const userRole = (res.data?.user as any)?.role || "user";
        if (userRole === "superadmin" || userRole === "admin") {
          router.push("/admin");
        } else {
          router.push("/profile");
        }
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setErrorMessage(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "facebook" | "apple") => {
    if (provider === "apple") return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await authClient.signIn.social({
        provider: provider as any,
        callbackURL: "/profile",
        ...(provider === "facebook" ? { scope: ["public_profile"] } : {}),
      });

      if (res?.error) {
        setErrorMessage(
          res.error.message ||
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign in failed.`
        );
      }
    } catch (err: any) {
      console.error(`Social auth error for ${provider}:`, err);
      setErrorMessage(
        err?.message ||
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth authentication error.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier) {
      setErrorMessage("Enter email or phone number");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const res = await sendOtpVerificationAction(resetIdentifier);
      if (res.success) {
        setInfoMessage("Verification code sent to your email. Please check your inbox.");
        setOtpCode("");
        setAuthMode("reset-code");
      } else {
        setErrorMessage(res.error || "Failed to send verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to request code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!newPassword) {
      setErrorMessage("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please rewrite your new password accurately.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const res = await resetPasswordWithOtpAction(resetIdentifier, otpCode, newPassword);
      if (res.success) {
        setInfoMessage("Password updated successfully. Please sign in with your new password.");
        setEmail(resetIdentifier);
        setPassword(newPassword);
        setAuthMode("signin");
      } else {
        setErrorMessage(res.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
      <SiteNav variant="auth" />
      <div style={{ position: "relative", display: "flex", width: "100%", minHeight: "100vh" }}>

        {/* Left: photo panel */}
        <div style={{
          flex: 1, minWidth: 0, background: "#f0f0f0",
          overflow: "hidden", position: "relative", minHeight: "600px",
        }}>
          <img
            alt="LIVUS jersey"
            src={typeof signinPhoto === 'string' ? signinPhoto : signinPhoto?.src}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Right: dark form panel */}
        <div style={{
          flex: 1, minWidth: 0, background: "#0d0d0d",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "120px 36px",
        }}>
          <div style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans rounded-none">
                {errorMessage}
              </div>
            )}

            {/* Success Info Alert */}
            {infoMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-sans rounded-none">
                {infoMessage}
              </div>
            )}

            {/* MODE 1: SIGN IN */}
            {authMode === "signin" && (
              <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{
                    fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                    fontSize: "48px", lineHeight: "56px", fontWeight: 600,
                    color: "#ffffff", letterSpacing: "-1.44px",
                  }}>Sign in</p>
                  <p style={{
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "18px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
                  }}>Please provide your credentials to proceed</p>
                </div>

                {/* Input Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <InputField label="Phone number or email address" type="text" value={email} onChange={setEmail} variant="dark" autoComplete="username" />
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="relative w-full">
                      <InputField
                        label="Password"
                        type={showSignInPassword ? "text" : "password"}
                        value={password}
                        onChange={setPassword}
                        variant="dark"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-0 top-6 p-2 text-neutral-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setInfoMessage("");
                          setAuthMode("reset-request");
                        }}
                        className="text-xs text-neutral-400 hover:text-white underline underline-offset-4 font-sans tracking-wider transition-colors bg-transparent border-none cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONTINUE Button BEFORE Social Login Options (as requested in screenshot) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "inline-flex" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: "#ffffff", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "12px 20px",
                        fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                        fontSize: "17px", lineHeight: "24px", color: "#000000", fontWeight: 500,
                      }}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                      <span>{loading ? "Authenticating..." : "Continue"}</span>
                    </button>
                  </div>
                </div>

                {/* Or sign in with Divider + 3 Social Buttons (Google, Facebook, Apple) */}
                <div className="flex flex-col gap-3.5 w-full pt-1">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 border-b border-dashed border-neutral-800" />
                    <span className="text-[13px] font-sans text-neutral-400">Or sign in with</span>
                    <div className="flex-1 border-b border-dashed border-neutral-800" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={() => handleSocialSignIn("google")}
                      aria-label="Sign in with Google"
                      className="w-full h-12 bg-[#181818] hover:bg-[#242424] border border-neutral-800 text-white flex items-center justify-center transition-colors cursor-pointer rounded-none"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.04.0 12s.47 3.8 1.29 5.42l3.99-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={() => handleSocialSignIn("facebook")}
                      aria-label="Sign in with Facebook"
                      className="w-full h-12 bg-[#181818] hover:bg-[#242424] border border-neutral-800 text-white flex items-center justify-center transition-colors cursor-pointer rounded-none"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>

                    {/* Apple (Visual same as Google/Facebook, click does nothing) */}
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      aria-label="Sign in with Apple"
                      className="w-full h-12 bg-[#181818] border border-neutral-800 text-white flex items-center justify-center cursor-default rounded-none"
                    >
                      <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.31c.67-.82 1.13-1.96.99-3.11-.98.04-2.18.66-2.88 1.47-.63.73-1.18 1.9-1.03 3.03 1.1.09 2.24-.57 2.92-1.39z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p style={{
                  fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                  fontSize: "15px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
                }}>
                  Or{" "}
                  <span
                    className="underline underline-offset-4 cursor-pointer font-medium hover:opacity-80 transition-opacity text-[15px]"
                    onClick={() => router.push("/signup")}
                  >
                    create an account
                  </span>
                </p>
              </form>
            )}

            {/* MODE 2: RESET PASSWORD REQUEST (SEARCH ACCOUNT) */}
            {authMode === "reset-request" && (
              <form onSubmit={handleRequestOtp} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{
                    fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                    fontSize: "48px", lineHeight: "56px", fontWeight: 600,
                    color: "#ffffff", letterSpacing: "-1.44px",
                  }}>Reset password</p>
                  <p style={{
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "18px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
                  }}>Please enter your account information</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <InputField
                    label="Enter email or phone number"
                    type="text"
                    value={resetIdentifier}
                    onChange={setResetIdentifier}
                    variant="dark"
                    autoComplete="username"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "inline-flex" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: "#ffffff", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "12px 20px",
                        fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                        fontSize: "17px", lineHeight: "24px", color: "#000000", fontWeight: 500,
                      }}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                      <span>{loading ? "Sending code..." : "Continue"}</span>
                    </button>
                  </div>

                  <p style={{
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "15px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
                  }}>
                    <span
                      className="underline underline-offset-4 cursor-pointer font-medium hover:opacity-80 transition-opacity text-[15px]"
                      onClick={() => {
                        setErrorMessage("");
                        setInfoMessage("");
                        setAuthMode("signin");
                      }}
                    >
                      Return to sign in
                    </span>
                  </p>
                </div>
              </form>
            )}

            {/* MODE 3: ENTER 6-DIGIT BOX VERIFICATION CODE & REWRITE NEW PASSWORD */}
            {authMode === "reset-code" && (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p style={{
                    fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                    fontSize: "48px", lineHeight: "56px", fontWeight: 600,
                    color: "#ffffff", letterSpacing: "-1.44px",
                  }}>Verify code</p>
                  <p style={{
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "18px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
                  }}>Enter 6-digit code and set new password</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* 6 Individual Square Input Boxes for Verification Code */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-sans tracking-wider text-neutral-400">
                      6-digit verification code
                    </label>
                    <Otp6DigitBoxes value={otpCode} onChange={setOtpCode} />
                  </div>

                  {/* New Password with Eye Icon */}
                  <div className="relative w-full">
                    <InputField
                      label="New password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={setNewPassword}
                      variant="dark"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-0 top-6 p-2 text-neutral-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Rewrite / Confirm New Password with Eye Icon */}
                  <div className="relative w-full">
                    <InputField
                      label="Rewrite new password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      variant="dark"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-6 p-2 text-neutral-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "inline-flex" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        background: "#ffffff", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "12px 20px",
                        fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                        fontSize: "17px", lineHeight: "24px", color: "#000000", fontWeight: 500,
                      }}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                      <span>{loading ? "Saving..." : "Update password & sign in"}</span>
                    </button>
                  </div>

                  <p style={{
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "15px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
                  }}>
                    <span
                      className="underline underline-offset-4 cursor-pointer font-medium hover:opacity-80 transition-opacity text-[15px]"
                      onClick={() => {
                        setErrorMessage("");
                        setInfoMessage("");
                        setAuthMode("signin");
                      }}
                    >
                      Return to sign in
                    </span>
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
