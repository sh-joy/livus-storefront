"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { InputField } from "./InputField";
import { addNewsletterSubscriberAction } from "@/app/actions/subscribers";

interface SiteFooterProps {
  variant?: "light" | "dark";
}

export function SiteFooter({ variant = "light" }: SiteFooterProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [subscribeMsg, setSubscribeMsg] = useState("");

  const handleSubscribe = async () => {
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setSubscribeState("error");
      setSubscribeMsg("Please enter a valid email address.");
      return;
    }
    setSubscribeState("loading");
    const res = await addNewsletterSubscriberAction(clean);
    if (res.success) {
      setSubscribeState("done");
      setSubscribeMsg("Thanks for subscribing!");
      setEmail("");
    } else {
      setSubscribeState("error");
      setSubscribeMsg(res.message || "Could not subscribe. Please try again.");
    }
  };

  const isDark = variant === "dark";
  const bg = isDark ? "var(--surface-dark)" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#333333";
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "#1c1c1c";

  const linkStyle: CSSProperties = {
    fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
    fontSize: "17px", lineHeight: "24px", letterSpacing: "0.17px",
    color: textColor, cursor: "pointer", fontWeight: 400,
    transition: "opacity 0.2s ease",
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Collections", path: "/for-him" },
    { label: "All Products", path: "/all-products" },
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Profile", path: "/profile" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
    { label: "Shipping & Returns", path: "/shipping-returns" },
  ];

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/livus.bd" },
    { label: "Instagram", href: "https://www.instagram.com/livus.atelier" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <footer className="!px-[36px] !pt-[140px] !pb-[36px] max-md:!px-[16px] max-md:!pt-[72px] max-md:!pb-[24px]" style={{
      background: bg,
      borderTop: "none",
      flexShrink: 0,
      width: "100%",
      boxSizing: "border-box",
    }}>
      <div className="max-md:!flex-col-reverse max-md:!gap-[48px]" style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "space-between",
        gap: "36px",
      }}>

        {/* Left: LIVUS logo + copyright space-between vertically */}
        <div className="max-md:!gap-[24px]" style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: "1 0 0",
          minWidth: 0,
        }}>
          <p
            className="livus-logo"
            style={{
              fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
              fontSize: "30px", fontWeight: 600, letterSpacing: "9px",
              lineHeight: "26px", color: isDark ? "#ffffff" : "#000000",
              cursor: "pointer",
            }}
            onClick={() => router.push("/")}
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
        <div className="max-md:!flex-col max-md:!gap-[40px]" style={{ display: "flex", flex: "1 0 0", minWidth: 0, gap: "4px", alignItems: "flex-start" }}>

          {/* Unified btn-group across both Nav & Social link columns */}
          <div
            className="footer-btn-group max-md:!w-full"
            style={{ flex: "2 0 0", display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            {/* Nav links column */}
            <div style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: "16px", padding: "0 8px" }}>
              {navLinks.map(({ label, path }) => (
                <p key={label} style={linkStyle} onClick={() => router.push(path)}>{label}</p>
              ))}
            </div>

            {/* Social links column */}
            <div style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: "16px", padding: "0 8px" }}>
              {socialLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{ ...linkStyle, textDecoration: "none", display: "block" }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div className="max-md:!w-full max-md:!max-w-none max-md:!flex-none" style={{ flex: "320 0 0", maxWidth: "320px", minWidth: "200px", display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "14px", letterSpacing: "0.7px", textTransform: "uppercase",
                lineHeight: "24px", color: mutedColor, whiteSpace: "nowrap",
              }}>Subscribe to our newsletter</p>

              <InputField
                label="Enter your email address"
                type="email"
                value={email}
                onChange={(v: string) => { setEmail(v); if (subscribeState !== "loading") setSubscribeState("idle"); }}
                variant={isDark ? "dark" : "light"}
              />
            </div>
            {subscribeState === "done" || subscribeState === "error" ? (
              <p style={{ fontSize: "14px", marginTop: "-18px", color: subscribeState === "error" ? "#c0392b" : (isDark ? "#9fe0a8" : "#1e7a34") }}>
                {subscribeMsg}
              </p>
            ) : null}
            <button
              type="button"
              disabled={subscribeState === "loading"}
              onClick={handleSubscribe}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "#050505", color: "#ffffff", border: "none", cursor: "pointer",
                padding: "12px 20px", alignSelf: "flex-start",
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "17px", lineHeight: "24px", fontWeight: 400,
                textTransform: "uppercase",
              }}
            >
              {subscribeState === "loading" ? "SUBSCRIBING…" : "SUBSCRIBE"}
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
