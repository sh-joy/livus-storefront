'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;

    for (let i = 0; i < 10; i++) {
      if (!el) break;

      const text = el.textContent?.trim();

      // Brand Logo
      if (text === "LIVUS" && (el.tagName === "P" || el.tagName === "SPAN" || el.tagName === "DIV" || el.tagName === "A")) {
        router.push("/");
        return;
      }

      // Shop For Him
      if (text === "Shop For Him" || text === "For Him" || text === "SHOP FOR HIM") {
        router.push("/for-him");
        return;
      }

      // Shop For Her
      if (text === "Shop For Her" || text === "For Her" || text === "SHOP FOR HER") {
        router.push("/for-her");
        return;
      }


      // Search
      if (text === "Search" || text?.toLowerCase() === "search") {
        if (!el.closest('form')) {
          if (el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "P" || el.tagName === "DIV") {
            router.push("/search");
            return;
          }
        }
      }

      // Sign In / Account
      if (text === "Sign in" || text === "Account" || text === "Sign In") {
        router.push("/signin");
        return;
      }

      // Sign Up
      if (text === "Sign up" || text === "Create account" || text === "Sign Up") {
        router.push("/signup");
        return;
      }

      // Checkout
      if (text === "Checkout" || text === "Proceed to checkout" || text === "Place order") {
        router.push("/checkout");
        return;
      }

      // Profile
      if (text === "Profile" || text === "View my orders" || text === "My Profile") {
        router.push("/profile");
        return;
      }

      el = el.parentElement;
    }
  };

  return (
    <div className="w-full min-h-screen overflow-x-clip flex flex-col items-center justify-start" onClick={handleClick}>
      {children}
    </div>
  );
}
