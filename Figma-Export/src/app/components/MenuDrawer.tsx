import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { useDrawer } from "./DrawerContext";

const NAV_LINKS = [
  { label: "All", path: "/" },
  { label: "For Him", path: "/for-him" },
  { label: "For Her", path: "/for-her" },
  { label: "Latest", path: "/" },
  { label: "Popular", path: "/" },
  { label: "Accessories", path: "/" },
  { label: "Gift Card", path: "/" },
  { label: "About", path: "/" },
  { label: "Contact", path: "/" },
];

export function MenuDrawer() {
  const { menuOpen, closeMenu } = useDrawer();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    closeMenu();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start"
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
              {/* Header */}
              <div className="flex items-center justify-between w-full shrink-0">
                <p className="font-['Barlow_Semi_Condensed:Regular',sans-serif] leading-[28px] text-[22px] text-white whitespace-nowrap">
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

              {/* Nav links — btn-group for group fade on hover */}
              <div className="btn-group flex flex-col gap-[20px] items-start w-full">
                {NAV_LINKS.map((item) => (
                  <p
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className="font-['Big_Shoulders_Display:SemiBold',sans-serif] font-semibold leading-[32px] text-[28px] text-white whitespace-nowrap cursor-pointer"
                    style={{ transition: "opacity 0.2s ease" }}
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
