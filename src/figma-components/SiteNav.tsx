'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from '@/lib/store/cart-store';
import { useSession } from '@/lib/auth-client';
import { useDrawer } from "./DrawerContext";
import { AnnouncementMarquee } from "./AnnouncementMarquee";

interface SiteNavProps {
  /** "standard" = full store header. "auth" = minimal header for sign-in pages. */
  variant?: "standard" | "auth";
  /** Override logo color (auth variant) */
  logoColor?: string;
  /** Kept for backwards compatibility with existing callers */
  textColor?: string;
  bgStyle?: string;
}

const PRIMARY_LINKS = [
  { label: "Shop All", href: "/all-products" },
  { label: "For Him", href: "/for-him" },
  { label: "For Her", href: "/for-her" },
  { label: "New In", href: "/latest" },
];

const logoClass =
  "livus-logo select-none no-underline text-[#0d0d0d] font-semibold leading-none " +
  "text-[24px] tracking-[0.28em] md:text-[28px] md:tracking-[0.32em]";
const logoStyle = { fontFamily: "'Big Shoulders', 'Big Shoulders Display', sans-serif" } as const;

export function SiteNav({ variant = "standard", logoColor = "#0d0d0d" }: SiteNavProps) {
  const pathname = usePathname();
  const { openMenu, openCart } = useDrawer();
  const cartItems = useCartStore((state) => state.items);
  const storeOpenCart = useCartStore((state) => state.openCart);
  const { data: sessionData } = useSession();

  // The cart lives in localStorage, so only show the count after mounting (avoids hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = mounted ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;
  const user = sessionData?.user;
  const isAdmin = ["admin", "superadmin"].includes(((user as { role?: string } | undefined)?.role) || "");

  if (variant === "auth") {
    return (
      <nav className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-between px-[var(--lv-gutter)] h-16 md:h-[72px] pointer-events-none">
        <Link
          href="/"
          className={`${logoClass} pointer-events-auto max-md:!text-white`}
          style={{ ...logoStyle, color: logoColor }}
        >
          LIVUS
        </Link>
        <Link href="/" className="t-nav lv-link pointer-events-auto flex items-center h-10" style={{ color: "#fff" }}>
          Visit shop
        </Link>
      </nav>
    );
  }

  const handleCartClick = () => {
    openCart();
    storeOpenCart();
  };

  const showMarquee = !["/signin", "/signup", "/profile", "/checkout"].includes(pathname);
  const isActive = (href: string) => pathname === href;

  return (
    <>
      {showMarquee && <AnnouncementMarquee />}

      <header
        className={`site-header-fixed sticky top-0 z-[9999] w-full transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? "bg-white/90 border-b border-[var(--lv-line)] shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
            : "bg-white/70 border-b border-transparent"
        }`}
        style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      >
        <nav
          aria-label="Main"
          className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-[72px] px-[var(--lv-gutter)] text-[#0d0d0d]"
        >
          {/* Left: menu + primary links */}
          <div className="flex items-center gap-4 xl:gap-6 min-w-0">
            <button
              type="button"
              onClick={openMenu}
              aria-label="Open menu"
              className="flex items-center justify-center size-10 -ml-2 bg-transparent border-none cursor-pointer text-inherit"
            >
              <Menu className="size-[22px] stroke-[1.5]" aria-hidden />
            </button>
            <ul className="hidden lg:flex items-center gap-5 xl:gap-6 list-none m-0 p-0">
              {PRIMARY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="t-nav lv-link flex items-center h-10"
                    aria-current={isActive(l.href) ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Center: logo */}
          <Link href="/" aria-label="LIVUS home" className={logoClass} style={logoStyle}>
            LIVUS
          </Link>

          {/* Right: search, account, cart */}
          <div className="flex items-center justify-end gap-1 min-[360px]:gap-2.5 lg:gap-5 xl:gap-6 min-w-0">
            {isAdmin && (
              <Link href="/admin" className="t-nav lv-link hidden xl:flex items-center h-10 text-[#b45309]">
                Admin
              </Link>
            )}
            <Link href="/search" aria-label="Search" className="flex items-center gap-2 h-10 px-1 text-inherit no-underline">
              <Search className="size-[20px] stroke-[1.5]" aria-hidden />
              <span className="t-nav hidden lg:inline">Search</span>
            </Link>
            <Link
              href={user ? "/profile" : "/signin"}
              aria-label={user ? "My account" : "Sign in"}
              className="flex items-center gap-2 h-10 px-1 text-inherit no-underline"
            >
              <User className="size-[20px] stroke-[1.5]" aria-hidden />
              <span className="t-nav hidden lg:inline">{user ? "Account" : "Sign in"}</span>
            </Link>
            <button
              type="button"
              onClick={handleCartClick}
              aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className="relative flex items-center gap-2 h-10 px-1 bg-transparent border-none cursor-pointer text-inherit"
            >
              <span className="relative flex">
                <ShoppingBag className="size-[20px] stroke-[1.5]" aria-hidden />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0d0d0d] text-white text-[10px] leading-[17px] text-center font-medium tabular-nums">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span className="t-nav hidden lg:inline">Cart</span>
            </button>
          </div>
        </nav>
      </header>
    </>
  );
}
