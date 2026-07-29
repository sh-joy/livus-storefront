import { useState } from "react";
import { useNavigate } from "react-router";
import { InputField } from "./InputField";
import { SiteFooter } from "./SiteFooter";
import signinPhoto from "../../imports/SignIn/147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";

function ArrowIcon({ color = "black" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
      <path d="M4.1 0V13.33" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M0 9.23L4.1 13.33L8.2 9.23" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Two-column section — full viewport height */}
      <div style={{ position: "relative", display: "flex", height: "100vh" }}>

        {/* Absolute nav — LIVUS black left, Visit Shop white right */}
        <nav style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 36px",
        }}>
          <p
            style={{
              fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
              fontSize: "30px", lineHeight: "26px", letterSpacing: "9px",
              fontWeight: 700, color: "#000000", cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            LIVUS
          </p>
          <p
            style={{
              fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
              fontSize: "17px", letterSpacing: "0.85px", textTransform: "uppercase",
              color: "#ffffff", cursor: "pointer", fontWeight: 400,
            }}
            onClick={() => navigate("/")}
          >
            Visit Shop
          </p>
        </nav>

        {/* Left: photo panel */}
        <div style={{
          flex: 1, minWidth: 0, background: "#f0f0f0",
          overflow: "hidden", position: "relative", minHeight: "600px",
        }}>
          <img
            alt="LIVUS jersey"
            src={signinPhoto}
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
          {/* Form: 360px wide, matching Figma exactly */}
          <div style={{ width: "360px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: "48px" }}>

            {/* Heading + subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{
                fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
                fontSize: "48px", lineHeight: "56px", fontWeight: 600,
                color: "#ffffff", letterSpacing: "-1.44px",
              }}>Sign in</p>
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "18px", lineHeight: "24px", color: "#cccccc", fontWeight: 400,
              }}>Please provide your credentials to proceed</p>
            </div>

            {/* Input fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <InputField label="Email address or phone number" type="email" value={email} onChange={setEmail} variant="dark" autoComplete="email" />
              <InputField label="Password" type="password" value={password} onChange={setPassword} variant="dark" autoComplete="current-password" />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Continue button — white bg, matching Figma Frame189Status */}
              <div style={{ display: "inline-flex" }}>
                <button
                  onClick={() => navigate("/profile")}
                  style={{
                    background: "#ffffff", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "6px 12px 7px 14px",
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

              {/* Create account link */}
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", lineHeight: "24px", color: "#ffffff", fontWeight: 400,
              }}>
                or{"  "}
                <span
                  style={{ fontWeight: 500, cursor: "pointer" }}
                  onClick={() => navigate("/signup")}
                >
                  Create an account
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
