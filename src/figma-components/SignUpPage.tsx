import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputField";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import signupPhoto from "@/imports/SignIn/147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";

export function SignUpPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Two-column section — full viewport height */}
      <SiteNav variant="auth" />
      <div style={{ position: "relative", display: "flex", width: "100%", minHeight: "100vh" }}>

        {/* Left: photo panel */}
        <div style={{
          flex: 1, minWidth: 0, background: "#f0f0f0",
          overflow: "hidden", position: "relative", minHeight: "700px",
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
          <div style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "36px" }}>

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

            {/* Input fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <InputField label="Name" value={name} onChange={setName} variant="dark" autoComplete="name" />
              <InputField label="Email address" type="email" value={email} onChange={setEmail} variant="dark" autoComplete="email" />
              <InputField label="Phone number" type="tel" value={phone} onChange={setPhone} variant="dark" autoComplete="tel" />
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

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "inline-flex" }}>
                <button
                  onClick={() => router.push("/")}
                  style={{
                    background: "#ffffff", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "6px 14px 7px 16px",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "17px", lineHeight: "24px", color: "#000000", fontWeight: 400,
                  }}
                >
                  Continue
                  <span style={{ display: "flex", alignItems: "center", transform: "rotate(-90deg) scaleX(-1)", width: 16, height: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
                      <path d="M8 1.3V14.7" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M3.9 10.6L8 14.7L12.1 10.6" stroke="black" strokeWidth="1.2" />
                    </svg>
                  </span>
                </button>
              </div>

              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
              }}>
                or{"  "}
                <span
                  style={{ fontWeight: 500, cursor: "pointer" }}
                  onClick={() => router.push("/signin")}
                >
                  Login to your existing account
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
