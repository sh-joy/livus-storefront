'use client';

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";

const MenuDrawer = dynamic(() => import("./MenuDrawer").then((mod) => mod.MenuDrawer), {
  ssr: false,
});
const CartDrawer = dynamic(() => import("./CartDrawer").then((mod) => mod.CartDrawer), {
  ssr: false,
});
const PromoPopup = dynamic(() => import("./PromoPopup").then((mod) => mod.PromoPopup), {
  ssr: false,
});
const CookieConsentBanner = dynamic(
  () => import("@/components/storefront/CookieConsentBanner").then((mod) => mod.CookieConsentBanner),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const { openMenu, openCart, openSizingGuide } = useDrawer();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    // Real links and anything inside a form handle their own clicks. Without this, clicking the
    // search box matched the "Search" text of its wrapper and pushed /search, wiping the query.
    if (el?.closest?.('form, input, textarea, select, label, a[href]')) return;
    for (let i = 0; i < 6; i++) {
      if (!el) break;
      const text = el.textContent?.trim();

      if (text?.toLowerCase() === "menu") { openMenu(); return; }
      if (text === "Cart") { openCart(); return; }
      if (text === "LIVUS" && (el.tagName === "P" || el.tagName === "SPAN" || el.tagName === "DIV" || el.tagName === "A")) {
        router.push("/");
        return;
      }
      if (text === "Shop For Him" || text === "For Him" || text === "SHOP FOR HIM") { router.push("/for-him"); return; }
      if (text === "Shop For Her" || text === "For Her" || text === "SHOP FOR HER") { router.push("/for-her"); return; }
      if (text === "Search" || text?.toLowerCase() === "search") {
        if (!el.closest('form')) {
          router.push("/search");
          return;
        }
      }
      if (text === "Sign in" || text === "Sign In") { router.push("/signin"); return; }
      if (text === "Sign up" || text === "Create account" || text === "Sign Up") { router.push("/signup"); return; }
      if (text === "Profile" || text === "My Profile") { router.push("/profile"); return; }
      if (text === "Checkout" || text === "Place order") { router.push("/checkout"); return; }

      el = el.parentElement;
    }
  };

  return (
    <div className="size-full" onClick={handleClick}>
      {children}
      <MenuDrawer />
      <CartDrawer />
      <Suspense fallback={null}>
        <PromoPopup />
      </Suspense>
      <CookieConsentBanner />
    </div>
  );
}
