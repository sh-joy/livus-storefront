'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";

const NAV_LINKS = [
  { label: "All Products", path: "/all-products" },
  { label: "For Him", path: "/for-him" },
  { label: "For Her", path: "/for-her" },
  { label: "Unisex", path: "/unisex" },
  { label: "Latest", path: "/latest" },
  { label: "Popular", path: "/popular" },
  { label: "Accessories", path: "/accessories" },
  { label: "Gift Card", path: "/all-products" },
  { label: "My Orders", path: "/profile" },
  { label: "About", path: "/" },
  { label: "Contact", path: "/" },
];

export function MenuDrawer() {
  const { menuOpen, closeMenu } = useDrawer();
  const router = useRouter();

  const handleNav = (path: string) => {
    closeMenu();
    router.push(path);
  };

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-start"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeMenu}
        >
          <motion.div
            className="bg-black h-full shrink-0 w-[300px] overflow-hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-[24px] p-[20px] size-full">
              {/* Header — 20px font size, regular 400 weight */}
              <div className="flex items-center justify-between w-full shrink-0">
                <p className="font-sans leading-[28px] text-[20px] text-white whitespace-nowrap font-normal">
                  Menu
                </p>
                <button
                  onClick={closeMenu}
                  className="shrink-0 size-[20px] cursor-pointer"
                  aria-label="Close menu"
                >
                  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                    <path d="M15 5L5 15" stroke="white" strokeLinejoin="round" strokeWidth="1.2" />
                    <path d="M5 5L15 15" stroke="white" strokeLinejoin="round" strokeWidth="1.2" />
                  </svg>
                </button>
              </div>

              {/* Nav links — btn-group for focus fade on hover */}
              <div className="btn-group menu-drawer-links flex flex-col gap-[20px] items-start w-full mt-4">
                {NAV_LINKS.map((item) => (
                  <p
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className="font-serif font-medium leading-[34px] text-[30px] text-white whitespace-nowrap cursor-pointer select-none"
                    style={{ fontWeight: 500, transition: "opacity 0.25s ease" }}
                  >
                    {item.label}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
