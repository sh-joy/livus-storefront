"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { addNewsletterSubscriberAction } from "@/app/actions/subscribers";
import { getPublicSiteProfileAction } from "@/app/actions/site-settings";
import { getSiteContentAction, type NewsletterCtaConfig, DEFAULT_NEWSLETTER_CTA } from "@/app/actions/site-content";
import { RichText } from "@/components/storefront/RichText";

// Brand icons
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

function TikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function YouTube({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 0-3.3 1.66 1.66 0 0 0 0 3.3m1.4 9.74v-8.37H5.06v8.37h2.8z" />
    </svg>
  );
}

interface SiteFooterProps {
  /** Kept for backwards compatibility with existing callers. */
  variant?: "light" | "dark";
  /** Hide the big newsletter block (checkout, account and order pages). */
  compact?: boolean;
}

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
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Dynamic Profile & Newsletter States
  const [aboutText, setAboutText] = useState(
    "LIVUS is a Bangladeshi sportswear brand. We design jerseys and everyday athletic wear for him and her in Dhaka, and deliver across Bangladesh."
  );
  const [brandName, setBrandName] = useState("LIVUS");
  const [brandLogo, setBrandLogo] = useState("");
  const [contact, setContact] = useState<{ email: string; phones: string[]; address: string }>({
    email: "support@livus.com.bd",
    phones: [],
    address: "House 24, Road 7, Dhanmondi, Dhaka 1205",
  });
  const [socials, setSocials] = useState<Array<{ label: string; href: string; icon: any }>>([
    { label: "Facebook", href: "https://www.facebook.com/livus.bd", icon: Facebook },
    { label: "Instagram", href: "https://www.instagram.com/livus.atelier", icon: Instagram },
  ]);
  const [cta, setCta] = useState<NewsletterCtaConfig>(DEFAULT_NEWSLETTER_CTA);

  useEffect(() => {
    let alive = true;
    getPublicSiteProfileAction()
      .then((p) => {
        if (!alive || !p) return;
        if (p.brand?.name) setBrandName(p.brand.name);
        if (p.brand?.logoUrl) setBrandLogo(p.brand.logoUrl);
        if (p.footer?.about) setAboutText(p.footer.about);
        setContact({
          email: p.contact?.email || "support@livus.com.bd",
          phones: p.contact?.phones || [],
          address: p.contact?.address || "House 24, Road 7, Dhanmondi, Dhaka 1205",
        });

        const activeSocials: Array<{ label: string; href: string; icon: any }> = [];
        if (p.social?.facebook) activeSocials.push({ label: "Facebook", href: p.social.facebook, icon: Facebook });
        if (p.social?.instagram) activeSocials.push({ label: "Instagram", href: p.social.instagram, icon: Instagram });
        if (p.social?.tiktok) activeSocials.push({ label: "TikTok", href: p.social.tiktok, icon: TikTok });
        if (p.social?.youtube) activeSocials.push({ label: "YouTube", href: p.social.youtube, icon: YouTube });
        if (p.social?.x) activeSocials.push({ label: "X", href: p.social.x, icon: XIcon });
        if (p.social?.linkedin) activeSocials.push({ label: "LinkedIn", href: p.social.linkedin, icon: LinkedIn });
        setSocials(activeSocials);
      })
      .catch(() => {});

    getSiteContentAction("newsletter_cta")
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") setCta({ ...DEFAULT_NEWSLETTER_CTA, ...parsed });
        } catch {}
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
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
    <footer
      className={`w-full shrink-0 bg-white text-[#0d0d0d] mt-[clamp(40px,6vw,88px)] ${
        compact ? "border-t border-[var(--lv-line)]" : ""
      }`}
    >
      {/* Newsletter CTA */}
      {!compact && (
        <section aria-labelledby="footer-cta-title" className="mx-[var(--lv-gutter)] grid grid-cols-1 md:grid-cols-2">
          <div className="relative bg-[#f0f0f0] aspect-[4/3] md:aspect-auto overflow-hidden">
            <Image
              src={cta.imageUrl || DEFAULT_NEWSLETTER_CTA.imageUrl}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-contain object-bottom pt-8"
            />
          </div>
          <div className="bg-[#eceef1] flex flex-col justify-center gap-4 p-[var(--lv-gutter)] md:p-[clamp(28px,4vw,64px)]">
            <h2 id="footer-cta-title" className="t-h2 m-0 whitespace-pre-line">
              {cta.heading || DEFAULT_NEWSLETTER_CTA.heading}
            </h2>
            <p className="t-body m-0 text-[#4a4a4a]">
              {cta.text || DEFAULT_NEWSLETTER_CTA.text}
            </p>
            <form onSubmit={handleSubscribe} noValidate className="flex flex-col gap-2 mt-2 w-full">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state !== "loading") setState("idle");
                  }}
                  className="w-full sm:w-auto sm:flex-1 min-w-0 h-11 shrink-0 px-4 bg-white border border-transparent focus:border-[#0d0d0d] outline-none text-[#0d0d0d] placeholder:text-[#8a8a8a] text-[16px]"
                  style={{ fontFamily: "'Overused Grotesk', sans-serif" }}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="lv-btn lv-btn--solid sm:min-w-[160px] disabled:opacity-60"
                >
                  {state === "loading" ? "Joining…" : cta.buttonLabel || "Subscribe"}
                </button>
              </div>
              {(state === "done" || state === "error") && (
                <p
                  role="status"
                  className={`t-small m-0 ${state === "error" ? "text-[#b42318]" : "text-[#1f7a3a]"}`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </section>
      )}

      {/* Main: logo + about/contact (left), link columns (right) */}
      <div
        className={`px-[var(--lv-gutter)] pb-6 md:pb-8 ${
          compact ? "pt-[clamp(32px,4vw,56px)]" : "pt-[clamp(40px,6vw,88px)]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 md:gap-10">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              aria-label={`${brandName} home`}
              className="livus-logo self-start select-none no-underline text-[#0d0d0d] leading-none text-[32px] tracking-[0.3em] flex items-center"
              style={logoStyle}
            >
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogo} alt={brandName} className="h-8 md:h-9 w-auto object-contain" />
              ) : (
                brandName
              )}
            </Link>
            <div className="flex flex-col gap-3 max-w-[380px]">
              <div className="t-body m-0 text-[#4a4a4a]">
                <RichText text={aboutText} />
              </div>
              <address className="not-italic flex flex-col gap-1 t-body text-[#1a1a1a]">
                {contact.address && <span>{contact.address}</span>}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="text-[#1a1a1a] underline underline-offset-4 self-start">
                    {contact.email}
                  </a>
                )}
                {contact.phones.map((phone, i) => (
                  <a
                    key={i}
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-[#1a1a1a] underline underline-offset-4 self-start"
                  >
                    {phone}
                  </a>
                ))}
              </address>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-col md:grid md:grid-cols-4 md:gap-x-12 lg:pt-[56px]">
            {[
              ...COLUMNS.map((col) => ({
                title: col.title,
                items: col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="lv-link t-body text-[#1a1a1a]">
                    {l.label}
                  </Link>
                )),
              })),
              ...(socials.length > 0
                ? [
                    {
                      title: "Social",
                      items: socials.map(({ label, href, icon: Icon }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lv-link t-body text-[#1a1a1a] inline-flex items-center gap-2"
                        >
                          <Icon className="size-[18px]" aria-hidden />
                          {label}
                        </a>
                      )),
                    },
                  ]
                : []),
            ].map((col) => {
              const isOpen = openSection === col.title;
              return (
                <div key={col.title} className="flex flex-col md:gap-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenSection(isOpen ? null : col.title)}
                    className="md:hidden w-full h-10 flex items-center justify-between bg-transparent border-none p-0 cursor-pointer"
                  >
                    <span className="t-eyebrow text-[#0d0d0d]">{col.title}</span>
                    <ChevronDown
                      className={`size-5 stroke-[1.5] text-[#0d0d0d] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
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

      {/* Bottom bar: copyright + payment methods */}
      <div className="mx-[var(--lv-gutter)] border-t border-[var(--lv-line)] py-5 flex flex-col items-center text-center gap-4 xl:flex-row xl:items-center xl:justify-between xl:text-left xl:gap-8">
        <p className="t-small m-0 text-[#4a4a4a] flex flex-col items-center gap-0.5 xl:flex-row xl:gap-1.5 xl:whitespace-nowrap xl:shrink-0">
          <span>© {new Date().getFullYear()} {brandName}. All rights reserved.</span>
          <span className="text-[#8a8a8a]">
            <span className="hidden xl:inline">(</span>Made with ❤️ by{" "}
            <a
              href="https://shjoy.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-[#4a4a4a] hover:text-[#0d0d0d]"
            >
              JOY
            </a>
            <span className="hidden xl:inline">)</span>
          </span>
        </p>
        <ul
          aria-label="Payment methods"
          className="list-none m-0 p-0 flex flex-wrap items-center justify-center gap-1 max-w-[340px] sm:max-w-[560px] xl:max-w-none xl:flex-nowrap xl:justify-end"
        >
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
