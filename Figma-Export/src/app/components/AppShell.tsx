import { useNavigate } from "react-router";
import { useDrawer } from "./DrawerContext";
import { MenuDrawer } from "./MenuDrawer";
import { CartDrawer } from "./CartDrawer";
import { SizingGuideModal } from "./SizingGuideModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { openMenu, openCart, openSizingGuide } = useDrawer();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    let el: HTMLElement | null = e.target as HTMLElement;
    for (let i = 0; i < 5; i++) {
      if (!el) break;
      const text = el.textContent?.trim();
      if (text?.toLowerCase() === "menu") { openMenu(); return; }
      if (text === "Cart") { openCart(); return; }
      if (text === "Search") { navigate("/search"); return; }
      if (text === "Sign in") { navigate("/signin"); return; }
      if (text === "Size Guide" || text === "View Guide") { openSizingGuide(); return; }
      if (text === "Profile") { navigate("/profile"); return; }
      el = el.parentElement;
    }
  };

  return (
    <div className="size-full" onClick={handleClick}>
      {children}
      <MenuDrawer />
      <CartDrawer />
      <SizingGuideModal />
    </div>
  );
}
