import { useNavigate } from "react-router";
import type { CSSProperties } from "react";

interface SiteNavProps {
  /** "standard" shows Menu + Search/Cart/Sign in. "auth" shows just Visit Shop. */
  variant?: "standard" | "auth";
  /** Override logo color */
  logoColor?: string;
  /** Override right-side text color */
  textColor?: string;
  /** Override background */
  bgStyle?: string;
}

export function SiteNav({
  variant = "standard",
  logoColor = "#0d0d0d",
  textColor = "#0d0d0d",
  bgStyle = "rgba(255, 255, 255, 0.55)",
}: SiteNavProps) {
  const navigate = useNavigate();

  const linkStyle: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "17px",
    lineHeight: "24px",
    letterSpacing: "0.85px",
    textTransform: "uppercase",
    color: textColor,
    cursor: "pointer",
    fontWeight: 400,
  };

  if (variant === "auth") {
    return (
      <nav
        className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-[36px]"
        style={{ paddingTop: "16px", paddingBottom: "16px", backdropFilter: "blur(0px)" }}
      >
        <p
          style={{
            fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
            fontSize: "30px",
            lineHeight: "26px",
            letterSpacing: "9px",
            color: logoColor,
            cursor: "pointer",
            fontWeight: 700,
          }}
          onClick={() => navigate("/")}
        >
          LIVUS
        </p>
        <p style={{ ...linkStyle, color: textColor }}>Visit Shop</p>
      </nav>
    );
  }

  return (
    <nav
      className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-[36px]"
      style={{
        paddingTop: "16px",
        paddingBottom: "16px",
        backdropFilter: "blur(40px)",
        backgroundColor: bgStyle,
      }}
    >
      {/* Left: Menu */}
      <div className="btn-group" style={{ width: "500px" }}>
        <span style={linkStyle}>menu</span>
      </div>

      {/* Center: Logo */}
      <p
        style={{
          fontFamily: "var(--font-display, 'Big Shoulders Display', sans-serif)",
          fontSize: "30px",
          lineHeight: "26px",
          letterSpacing: "9px",
          color: logoColor,
          cursor: "pointer",
          fontWeight: 700,
          flexShrink: 0,
        }}
        onClick={() => navigate("/")}
      >
        LIVUS
      </p>

      {/* Right: Search / Cart / Sign in */}
      <div
        className="btn-group"
        style={{
          width: "500px",
          display: "flex",
          gap: "36px",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <span style={linkStyle}>Search</span>
        <span style={linkStyle}>Cart</span>
        <span style={linkStyle}>Sign in</span>
      </div>
    </nav>
  );
}
