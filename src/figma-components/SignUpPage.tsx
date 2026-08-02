import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import signupPhoto from "@/imports/SignUp/147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";

export function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const urlError = searchParams?.get("error");
    if (urlError) {
      if (urlError === "access_denied") {
        setErrorMessage("Authentication cancelled. Returned to sign up.");
      } else {
        setErrorMessage(`Authentication error: ${urlError}`);
      }
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setErrorMessage("Please fill in all fields (name, phone number, email, and password).");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await authClient.signUp.email({
        email: email.trim(),
        password: password,
        name: name.trim(),
        phoneNumber: phone.trim(),
      } as any);

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to create account.");
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      console.error("Sign up failed:", err);
      setErrorMessage(err?.message || "An unexpected error occurred during account creation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: "google" | "facebook" | "apple") => {
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
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign up failed.`
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
            src={typeof signupPhoto === 'string' ? signupPhoto : signupPhoto?.src}
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
          <form onSubmit={handleSignUp} style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Heading + subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{
                fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                fontSize: "48px", lineHeight: "56px", fontWeight: 600,
                color: "#ffffff", letterSpacing: "-1.44px",
              }}>Sign up</p>
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "18px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
              }}>Join the LIVUS community and get early access to new drops</p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-sans rounded-none">
                {errorMessage}
              </div>
            )}

            {/* Input fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <InputField label="Name" value={name} onChange={setName} variant="dark" autoComplete="name" />
              <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} variant="dark" autoComplete="tel" />
              <InputField label="Email address" type="email" value={email} onChange={setEmail} variant="dark" autoComplete="email" />
              <InputField label="Password" type="password" value={password} onChange={setPassword} variant="dark" autoComplete="new-password" />
            </div>

            {/* Newsletter checkbox */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer" }}>
              <div
                onClick={() => setNewsletter(!newsletter)}
                style={{
                  width: "20px", height: "20px", flexShrink: 0, marginTop: "2px",
                  border: `1px solid ${newsletter ? "#ffffff" : "#404040"}`,
                  background: newsletter ? "#ffffff" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {newsletter && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
              }}>
                I'd like to receive emails about updates &amp; offers
              </p>
            </label>

            {/* CONTINUE Button BEFORE Social Login Options (as requested) */}
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
                  <span>{loading ? "Creating account..." : "Continue"}</span>
                </button>
              </div>
            </div>

            {/* Or sign up with Divider + 3 Social Buttons (Google, Facebook, Apple) */}
            <div className="flex flex-col gap-3.5 w-full pt-1">
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 border-b border-dashed border-neutral-800" />
                <span className="text-[13px] font-sans text-neutral-400">Or sign up with</span>
                <div className="flex-1 border-b border-dashed border-neutral-800" />
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialSignUp("google")}
                  aria-label="Sign up with Google"
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
                  onClick={() => handleSocialSignUp("facebook")}
                  aria-label="Sign up with Facebook"
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
                  aria-label="Sign up with Apple"
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
              Already have an account?{" "}
              <span
                className="underline underline-offset-4 cursor-pointer font-medium hover:opacity-80 transition-opacity text-[15px]"
                onClick={() => router.push("/signin")}
              >
                Sign in
              </span>
            </p>
          </form>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
