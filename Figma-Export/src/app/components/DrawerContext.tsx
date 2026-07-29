import { createContext, useContext, useState } from "react";

interface DrawerCtx {
  menuOpen: boolean;
  cartOpen: boolean;
  sizingGuideOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openCart: () => void;
  closeCart: () => void;
  openSizingGuide: () => void;
  closeSizingGuide: () => void;
}

const DrawerContext = createContext<DrawerCtx>({
  menuOpen: false, cartOpen: false, sizingGuideOpen: false,
  openMenu: () => {}, closeMenu: () => {},
  openCart: () => {}, closeCart: () => {},
  openSizingGuide: () => {}, closeSizingGuide: () => {},
});

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sizingGuideOpen, setSizingGuideOpen] = useState(false);
  return (
    <DrawerContext.Provider value={{
      menuOpen, cartOpen, sizingGuideOpen,
      openMenu: () => { setCartOpen(false); setMenuOpen(true); },
      closeMenu: () => setMenuOpen(false),
      openCart: () => { setMenuOpen(false); setCartOpen(true); },
      closeCart: () => setCartOpen(false),
      openSizingGuide: () => setSizingGuideOpen(true),
      closeSizingGuide: () => setSizingGuideOpen(false),
    }}>
      {children}
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => useContext(DrawerContext);
