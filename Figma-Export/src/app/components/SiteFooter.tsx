import { useState } from "react";
import { useNavigate } from "react-router";
import type { CSSProperties } from "react";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

export function SiteFooter({ variant = "light" }: SiteFooterProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const isDark = variant === "dark";
  const bg = isDark ? "var(--surface-dark)" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#333333";
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "#1c1c1c";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const inputBorderColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";

  const linkStyle: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "17px", lineHeight: "24px", letterSpacing: "0.17px",
    color: textColor, cursor: "pointer", fontWeight: 400,
    transition: "opacity 0.2s ease",
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Collections", path: "/for-him" },
    { label: "Cart", path: "/" },
  ];

  const socialLinks = [
    { label: "Facebook" },
    { label: "Instagram" },
    { label: "Contact Us" },
  ];

  return (
    <footer style={{
      background: bg,
      borderTop: `1px solid ${borderColor}`,
      padding: "48px 36px 36px",
      flexShrink: 0,
      width: "100%",
      boxSizing: "border-box",
    }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        justifyContent: "space-between",
      }}>

        {/* Left: LIVUS at top, copyright at bottom */}
        <div style={{
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          flex: "1 0 0", minWidth: 0, minHeight: "160px",
        }}>
          <p
            style={{
              fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
              fontSize: "30px", fontWeight: 700, letterSpacing: "9px",
              lineHeight: "26px", color: isDark ? "#ffffff" : "#000000",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            LIVUS
          </p>
          <div style={{
            fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
            fontSize: "14px", letterSpacing: "0.7px", textTransform: "uppercase",
            lineHeight: "24px", color: mutedColor,
          }}>
            <p>Copyright © 2026 LIVUS</p>
            <p>
              Made with ❤️ by{" "}
              <span style={{ fontWeight: 500, textDecoration: "underline" }}>joy</span>
            </p>
          </div>
        </div>

        {/* Right: nav + social + subscribe */}
        <div style={{ display: "flex", flex: "1 0 0", minWidth: 0, gap: "4px", alignItems: "flex-start" }}>

          {/* Nav links */}
          <div
            className="btn-group"
            style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: "16px", padding: "0 8px" }}
          >
            {navLinks.map(({ label, path }) => (
              <p key={label} style={linkStyle} onClick={() => navigate(path)}>{label}</p>
            ))}
          </div>

          {/* Social links */}
          <div
            className="btn-group"
            style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: "16px", padding: "0 8px" }}
          >
            {socialLinks.map(({ label }) => (
              <p key={label} style={linkStyle}>{label}</p>
            ))}
          </div>

          {/* Subscribe */}
          <div style={{ flex: "320 0 0", maxWidth: "320px", minWidth: "200px", display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "14px", letterSpacing: "0.7px", textTransform: "uppercase",
                lineHeight: "24px", color: mutedColor, whiteSpace: "nowrap",
              }}>Subscribe to our newsletter</p>
              <div style={{ position: "relative", borderBottom: `1px solid ${inputBorderColor}` }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    display: "block", width: "100%",
                    padding: "9px 0", background: "transparent",
                    border: "none", outline: "none",
                    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                    fontSize: "17px", lineHeight: "24px", letterSpacing: "0.17px",
                    color: textColor,
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => { if (email) setEmail(""); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#050505", color: "#ffffff", border: "none", cursor: "pointer",
                padding: "7px 12px 8px 14px", alignSelf: "flex-start",
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "16px", lineHeight: "24px",
              }}
            >
              Subscribe
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
