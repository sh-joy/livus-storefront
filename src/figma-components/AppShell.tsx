'use client';

import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";
import { MenuDrawer } from "./MenuDrawer";
import { CartDrawer } from "./CartDrawer";
import { SizingGuideModal } from "./SizingGuideModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { openMenu, openCart, openSizingGuide } = useDrawer();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
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
    </div>
  );
}
