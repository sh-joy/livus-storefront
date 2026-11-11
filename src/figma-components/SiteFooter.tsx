"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

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
import { fetchStoreSettingsAction } from "@/app/actions/checkout";

interface SiteFooterProps {
  /** Kept for backwards compatibility with existing callers. */
  variant?: "light" | "dark";
  /** Hide the big newsletter block (checkout, account and order pages). */
  compact?: boolean;
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
    title: "My account",
    links: [
      { label: "Sign in / Register", href: "/signin" },
      { label: "Track order", href: "/profile" },
      { label: "Contact us", href: "/contact" },
      { label: "About LIVUS", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Shipping & returns", href: "/shipping-returns" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
    ],
  },
];

// Payment logos shown in the footer (files in public/payment-icons).
const PAYMENT_METHODS = [
  { file: "visa", name: "Visa" },
  { file: "mastercard", name: "Mastercard" },
  { file: "amex", name: "American Express" },
  { file: "unionpay", name: "UnionPay" },
  { file: "diners", name: "Diners Club" },
  { file: "dbbl-nexus", name: "DBBL Nexus" },
  { file: "bkash", name: "bKash" },
  { file: "nagad", name: "Nagad" },
  { file: "rocket", name: "Rocket" },
  { file: "ok-wallet", name: "OK Wallet" },
  { file: "surecash", name: "SureCash" },
  { file: "upay", name: "Upay" },
  { file: "dmoney", name: "Dmoney" },
  { file: "mcash", name: "mCash" },
  { file: "mycash", name: "MYCash" },
  { file: "qcash", name: "Q Cash" },
  { file: "islamic-wallet", name: "Islamic Wallet" },
  { file: "ab-bank", name: "AB Bank" },
  { file: "citytouch", name: "Citytouch" },
  { file: "brac-bank", name: "BRAC Bank" },
  { file: "bank-asia", name: "Bank Asia" },
  { file: "mtb", name: "MTB" },
];

const logoStyle = { fontFamily: "'Big Shoulders', 'Big Shoulders Display', sans-serif" } as const;

export function SiteFooter({ compact = false }: SiteFooterProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState<{ email: string; phone: string } | null>(null);
  // Phone footer: which link section is open (one at a time).
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStoreSettingsAction()
      .then((s) => {
        if (!alive || !s) return;
        setContact({
          email: s.supportEmail || "",
          phone: s.supportPhone || "",
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

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
    <footer className={`w-full shrink-0 bg-white text-[#0d0d0d] mt-[clamp(40px,6vw,88px)] ${compact ? "border-t border-[var(--lv-line)]" : ""}`}>
      {/* Newsletter CTA: image left, text + form right */}
      {!compact && (
      <section aria-labelledby="footer-cta-title" className="mx-[var(--lv-gutter)] grid grid-cols-1 md:grid-cols-2">
        <div className="relative bg-[#f0f0f0] aspect-[4/3] md:aspect-auto overflow-hidden">
          <Image
            src="/figma-assets/71b3cd582dab7174e13346a8d88abe33548d2aa7.png"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="object-contain object-bottom pt-8"
          />
        </div>
        <div className="bg-[#eceef1] flex flex-col justify-center gap-4 p-[var(--lv-gutter)] md:p-[clamp(28px,4vw,64px)]">
          <h2 id="footer-cta-title" className="t-h2 m-0">Made for the game.<br />Built for the street.</h2>
          <p className="t-body m-0 text-[#4a4a4a]">
            New drops, restocks and members-only offers first. No spam — unsubscribe any time.
          </p>
          <form onSubmit={handleSubscribe} noValidate className="flex flex-col gap-2 mt-2 w-full">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
              <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
              <input
                id="footer-newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state !== "loading") setState("idle"); }}
                className="w-full sm:w-auto sm:flex-1 min-w-0 h-11 shrink-0 px-4 bg-white border border-transparent focus:border-[#0d0d0d] outline-none text-[#0d0d0d] placeholder:text-[#8a8a8a] text-[16px]"
                style={{ fontFamily: "'Overused Grotesk', sans-serif" }}
              />
              <button
                type="submit"
                disabled={state === "loading"}
                className="lv-btn lv-btn--solid sm:min-w-[160px] disabled:opacity-60"
              >
                {state === "loading" ? "Joining…" : "Subscribe"}
              </button>
            </div>
            {(state === "done" || state === "error") && (
              <p role="status" className={`t-small m-0 ${state === "error" ? "text-[#b42318]" : "text-[#1f7a3a]"}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </section>
      )}

      {/* Main: logo + about/contact (left), link columns (right). On phones the link columns collapse. */}
      <div className="px-[var(--lv-gutter)] pt-[clamp(32px,4vw,56px)] pb-6 md:pb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 md:gap-10">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              aria-label="LIVUS home"
              className="livus-logo self-start select-none no-underline text-[#0d0d0d] leading-none text-[32px] tracking-[0.3em]"
              style={logoStyle}
            >
              LIVUS
            </Link>
            <div className="flex flex-col gap-3 max-w-[380px]">
              <p className="t-body m-0 text-[#4a4a4a]">
                LIVUS is a Bangladeshi sportswear brand. We design jerseys and everyday athletic wear for him and
                her in Dhaka, and deliver across Bangladesh.
              </p>
              {/* TODO(owner): demo office address — replace with the real one. */}
              <address className="not-italic flex flex-col gap-1 t-body text-[#1a1a1a]">
                <span>House 24, Road 7, Dhanmondi, Dhaka 1205</span>
                {contact?.email && (
                  <a href={`mailto:${contact.email}`} className="text-[#1a1a1a] underline underline-offset-4 self-start">
                    {contact.email}
                  </a>
                )}
                {contact?.phone && (
                  <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-[#1a1a1a] underline underline-offset-4 self-start">
                    {contact.phone}
                  </a>
                )}
              </address>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-col md:grid md:grid-cols-4 md:gap-x-12 lg:pt-[56px]"
          >
            {[
              ...COLUMNS.map((col) => ({
                title: col.title,
                items: col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="lv-link t-body text-[#1a1a1a]">{l.label}</Link>
                )),
              })),
              {
                title: "Social",
                items: SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="lv-link t-body text-[#1a1a1a] inline-flex items-center gap-2">
                    <Icon className="size-[18px]" aria-hidden />
                    {label}
                  </a>
                )),
              },
            ].map((col) => {
              const isOpen = openSection === col.title;
              return (
                <div key={col.title} className="flex flex-col md:gap-4">
                  {/* Phone: tap to open. Desktop: a plain heading. */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenSection(isOpen ? null : col.title)}
                    className="md:hidden w-full h-10 flex items-center justify-between bg-transparent border-none p-0 cursor-pointer"
                  >
                    <span className="t-eyebrow text-[#0d0d0d]">{col.title}</span>
                    <ChevronDown className={`size-5 stroke-[1.5] text-[#0d0d0d] transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  <p className="hidden md:block t-eyebrow m-0 text-[#8a8a8a]">{col.title}</p>
                  <ul className={`${isOpen ? "flex" : "hidden"} md:flex list-none m-0 p-0 pt-1 pb-3 md:p-0 flex-col gap-1.5`}>
                    {col.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom bar: copyright + payment methods (centred on phones) */}
      <div className="mx-[var(--lv-gutter)] border-t border-[var(--lv-line)] py-5 flex flex-col items-center text-center gap-4 xl:flex-row xl:items-center xl:justify-between xl:text-left xl:gap-8">
        <p className="t-small m-0 text-[#4a4a4a] flex flex-col items-center gap-0.5 xl:flex-row xl:gap-1.5 xl:whitespace-nowrap xl:shrink-0">
          <span>© {new Date().getFullYear()} LIVUS. All rights reserved.</span>
          <span className="text-[#8a8a8a]"><span className="hidden xl:inline">(</span>Made with ❤️ by <a href="https://shjoy.vercel.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#4a4a4a] hover:text-[#0d0d0d]">JOY</a><span className="hidden xl:inline">)</span></span>
        </p>
        <ul aria-label="Payment methods" className="list-none m-0 p-0 flex flex-wrap items-center justify-center gap-1 max-w-[340px] sm:max-w-[560px] xl:max-w-none xl:flex-nowrap xl:justify-end">
          {PAYMENT_METHODS.map((m) => (
            <li key={m.file} title={m.name} className="size-8 border border-[var(--lv-line)] bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/payment-icons/${m.file}.svg`} alt={m.name} width={32} height={32} loading="lazy" className="block size-full" />
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
