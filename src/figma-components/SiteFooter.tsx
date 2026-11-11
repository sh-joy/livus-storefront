"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Brand icons (lucide no longer ships brand logos)
function Facebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63c-.27-.04-1.19-.12-2.26-.12-2.24 0-3.77 1.37-3.77 3.88v2.17H7.95v2.94h2.53V21h3.02Z" />
    </svg>
  );
}
function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
import { addNewsletterSubscriberAction } from "@/app/actions/subscribers";

interface SiteFooterProps {
  /** Kept for backwards compatibility; the footer is always the dark brand footer now. */
  variant?: "light" | "dark";
}

// TODO(owner): confirm these are the official LIVUS pages before launch.
const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/livus.bd", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/livus.atelier", icon: Instagram },
];

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/all-products" },
      { label: "For him", href: "/for-him" },
      { label: "For her", href: "/for-her" },
      { label: "Unisex", href: "/unisex" },
      { label: "Accessories", href: "/accessories" },
      { label: "New in", href: "/latest" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track your order", href: "/profile" },
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "Contact us", href: "/contact" },
      { label: "My account", href: "/profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About LIVUS", href: "/about" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
    ],
  },
];

export function SiteFooter(_props: SiteFooterProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setState("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setState("loading");
    const res = await addNewsletterSubscriberAction(clean);
    if (res.success) {
      setState("done");
      setMessage("You're on the list. Watch your inbox for the next drop.");
      setEmail("");
    } else {
      setState("error");
      setMessage(res.message || "Could not subscribe right now. Please try again.");
    }
  };

  return (
    <footer className="w-full shrink-0 bg-[var(--lv-surface-dark)] text-white mt-[clamp(48px,8vw,120px)]">
      <div className="px-[var(--lv-gutter)] pt-[clamp(56px,7vw,96px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-10">
          {/* Newsletter */}
          <div className="lg:col-span-5 flex flex-col gap-5 max-w-[520px]">
            <p className="t-eyebrow m-0 text-white/55">Newsletter</p>
            <h2 className="t-h3 m-0 !text-white">Join the LIVUS list</h2>
            <p className="t-body m-0 text-white/65">
              New drops, restocks and members-only offers. No spam — unsubscribe any time.
            </p>
            <form onSubmit={handleSubscribe} noValidate className="flex flex-col gap-3 mt-1">
              <div className="flex items-stretch border-b border-white/30 focus-within:border-white transition-colors">
                <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (state !== "loading") setState("idle"); }}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-white placeholder:text-white/40 py-3 text-[16px]"
                  style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  aria-label="Subscribe"
                  className="flex items-center gap-2 px-1 bg-transparent border-none text-white cursor-pointer disabled:opacity-50 t-nav"
                >
                  <span className="hidden sm:inline">{state === "loading" ? "Joining…" : "Subscribe"}</span>
                  <ArrowRight className="size-[18px] stroke-[1.5]" aria-hidden />
                </button>
              </div>
              <p
                role="status"
                className={`t-small m-0 min-h-[21px] ${state === "error" ? "text-[#ff8a8a]" : "text-[#9fe0a8]"}`}
              >
                {state === "done" || state === "error" ? message : ""}
              </p>
            </form>
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10">
            {COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-col gap-5">
                <p className="t-eyebrow m-0 text-white/55">{col.title}</p>
                <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="lv-link t-body text-white/85 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Wordmark */}
        <Link
          href="/"
          aria-label="LIVUS home"
          className="livus-logo block select-none no-underline text-white/[0.08] hover:text-white/[0.14] transition-colors leading-[0.8] mt-[clamp(56px,8vw,112px)] -mb-[0.06em] text-center"
          style={{
            fontFamily: "'Big Shoulders', 'Big Shoulders Display', sans-serif",
            fontSize: "clamp(96px, 24vw, 380px)",
            letterSpacing: "0.12em",
            fontWeight: 700,
          }}
        >
          LIVUS
        </Link>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 px-[var(--lv-gutter)] py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="t-small m-0 text-white/55">
          © {new Date().getFullYear()} LIVUS. All rights reserved. · Made with ❤️ by <span className="underline">joy</span>
        </p>
        <p className="t-small m-0 text-white/55">
          We accept: <span className="text-white/85">Cash on delivery · bKash · Nagad</span>
        </p>
        <ul className="list-none m-0 p-0 flex items-center gap-5">
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LIVUS on ${label}`}
                className="flex text-white/70 hover:text-white transition-colors"
              >
                <Icon className="size-5 stroke-[1.5]" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
