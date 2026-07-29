'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useDrawer } from "./DrawerContext";
import { AnnouncementMarquee } from "./AnnouncementMarquee";

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
  const router = useRouter();
  const pathname = usePathname();
  const { openMenu, openCart } = useDrawer();

  // Exclude marquee on signin, signup, profile, and checkout pages
  const excludedMarqueeRoutes = ["/signin", "/signup", "/profile", "/checkout"];
  const showMarquee = variant !== "auth" && !excludedMarqueeRoutes.includes(pathname);

  const navLinkStyle: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "17px",
    lineHeight: "24px",
    letterSpacing: "0.85px",
    textTransform: "uppercase",
    color: textColor,
    cursor: "pointer",
    fontWeight: 400,
    userSelect: "none",
    WebkitUserSelect: "none",
    transition: "opacity 0.2s ease",
    textDecoration: "none",
    display: "inline-block",
  };

  if (variant === "auth") {
    return (
      <nav
        className="fixed left-0 right-0 top-0 z-[9999] flex items-center justify-between px-[36px] py-[16px] w-full pointer-events-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <Link
          href="/"
          className="livus-logo !tracking-[9px] pointer-events-auto"
          style={{
            fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
            fontSize: "30px",
            lineHeight: "26px",
            letterSpacing: "9px",
            color: logoColor,
            cursor: "pointer",
            fontWeight: 600,
            userSelect: "none",
            textDecoration: "none",
            pointerEvents: "auto",
          }}
        >
          LIVUS
        </Link>
        <Link
          href="/"
          className="nav-link hover:opacity-75 pointer-events-auto"
          style={{ ...navLinkStyle, color: "#ffffff", pointerEvents: "auto" }}
        >
          Visit Shop
        </Link>
      </nav>
    );
  }

  return (
    <>
      {/* 1. Marquee (First Child, position: relative, scrolls away) */}
      {showMarquee && <AnnouncementMarquee />}

      {/* 2. Header Container (Second Child, position: sticky, sticks to top: 0) */}
      <nav
        className="sticky top-0 left-0 right-0 z-[9999] flex items-center justify-between px-[36px] py-[16px] w-full backdrop-blur-[100px] site-header-fixed"
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 9999,
          backdropFilter: "blur(100px)",
          WebkitBackdropFilter: "blur(100px)",
          backgroundColor: bgStyle,
        }}
      >
        {/* Left: Menu */}
        <div style={{ width: "500px", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={openMenu}
            className="nav-link hover:opacity-75"
            style={{
              ...navLinkStyle,
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <p className="relative shrink-0" style={{ margin: 0, cursor: "pointer", fontSize: "17px" }}>menu</p>
          </button>
        </div>

        {/* Center: Logo */}
        <Link
          href="/"
          className="livus-logo !tracking-[9px]"
          style={{
            fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
            fontSize: "30px",
            lineHeight: "26px",
            letterSpacing: "9px",
            color: logoColor,
            cursor: "pointer",
            fontWeight: 600,
            flexShrink: 0,
            userSelect: "none",
            textDecoration: "none",
          }}
        >
          LIVUS
        </Link>

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
          <Link
            href="/search"
            className="nav-link"
            style={navLinkStyle}
          >
            <p className="relative shrink-0" style={{ margin: 0, cursor: "pointer", fontSize: "17px" }}>SEARCH</p>
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="nav-link"
            style={{
              ...navLinkStyle,
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <p className="relative shrink-0" style={{ margin: 0, cursor: "pointer", fontSize: "17px" }}>CART</p>
          </button>

          <Link
            href="/signin"
            className="nav-link"
            style={navLinkStyle}
          >
            <p className="relative shrink-0" style={{ margin: 0, cursor: "pointer", fontSize: "17px" }}>SIGN IN</p>
          </Link>
        </div>
      </nav>
    </>
  );
}
