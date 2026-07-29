'use client';
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";
import imgImage114 from "@/imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

function ProductImage() {
  return (
    <div className="bg-[#f0f0f0] flex h-[137px] items-center justify-center overflow-hidden shrink-0 w-[120px]">
      <div className="relative" style={{ width: "116.17%", height: "100%" }}>
        <img alt="product" className="absolute h-full object-cover top-0" style={{ left: "-8.01%", width: "116.17%" }} src={typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src} />
      </div>
    </div>
  );
}

interface CartItemProps {
  name: string;
  color: string;
  size: string;
  price: string;
  qty: number;
}

function CartItem({ name, color, size, price, qty }: CartItemProps) {
  const [count, setCount] = useState(qty);
  return (
    <div className="flex gap-[16px] items-start w-full shrink-0">
      <ProductImage />
      <div className="flex-1 flex flex-col justify-between py-[3px] self-stretch min-w-0">
        <div className="flex items-start justify-between w-full whitespace-nowrap leading-[24px] text-[#1c1c1c]">
          <div className="font-sans flex flex-col items-start shrink-0">
            <p className="text-[17px] font-medium tracking-[-0.34px]">{name}</p>
            <p className="text-[17px] tracking-[-0.085px]">Color: {color}</p>
            <p className="text-[17px] tracking-[-0.085px]">Size: {size}</p>
          </div>
          <p className="font-sans text-[17px] font-medium shrink-0">{price}</p>
        </div>
        <div className="flex items-center justify-between w-full shrink-0">
          <div className="flex gap-[16px] items-center">
            <button
              type="button"
              disabled={count <= 1}
              onClick={() => setCount(Math.max(1, count - 1))}
              className={`size-[20px] flex items-center justify-center transition-opacity ${
                count <= 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-75"
              }`}
              aria-label="Decrease quantity"
            >
              <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                <path d="M2.92893 10H17.0711" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
              </svg>
            </button>
            <p className="font-sans leading-[20px] text-[17px] tracking-[-0.34px] text-[#1c1c1c]">
              {count}
            </p>
            <button
              onClick={() => setCount(count + 1)}
              className="size-[20px] flex items-center justify-center cursor-pointer"
            >
              <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                <path d="M10 2.92893V17.0711" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                <path d="M2.92893 10H17.0711" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
          <p className="font-sans leading-[24px] text-[17px] tracking-[-0.085px] underline text-[#1c1c1c] cursor-pointer">
            Remove
          </p>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart } = useDrawer();
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-start justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeCart}
        >
          <motion.div
            className="bg-white h-full shrink-0 w-[560px] overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col justify-between p-[20px] size-full">
              {/* Top: header + items */}
              <div className="flex flex-col gap-[20px] items-start w-full">
                {/* Header — 20px font size, regular 400 weight */}
                <div className="flex items-center justify-between w-full shrink-0">
                  <p className="font-sans leading-[28px] text-[20px] text-[#1a1a1a] whitespace-nowrap font-normal">
                    Cart
                  </p>
                  <div className="flex gap-[20px] items-center">
                    <p className="font-sans text-[17px] tracking-[-0.085px] underline text-[#1c1c1c] cursor-pointer">
                      Clear All
                    </p>
                    <button onClick={closeCart} className="shrink-0 size-[20px] cursor-pointer" aria-label="Close cart">
                      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                        <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                        <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Item 1 */}
                <CartItem name="OWAYO - CROSS FADE" color="Black & White" size="XL" price="৳899 BDT" qty={1} />

                {/* Divider */}
                <div className="w-full h-px bg-[#E2E2E2] shrink-0" />

                {/* Item 2 */}
                <CartItem name="NIXON - TIME TELLER" color="Rose Gold" size="M" price="৳790 BDT" qty={2} />
              </div>

              {/* Bottom: subtotal + checkout */}
              <div className="flex flex-col gap-[20px] items-start w-full shrink-0">
                <div className="flex items-center justify-between w-full text-[#1c1c1c] text-[20px] font-medium tracking-[-0.4px] leading-[24px] whitespace-nowrap">
                  <p className="font-sans font-medium text-[20px]">Subtotal</p>
                  <p className="font-sans font-medium text-[20px]">৳1689 BDT</p>
                </div>
                <div onClick={handleCheckout} className="bg-[#050505] w-full flex items-center justify-center px-[20px] py-[12px] cursor-pointer hover:opacity-90 transition-opacity">
                  <p className="font-sans leading-[24px] text-[17px] text-white whitespace-nowrap">
                    Checkout
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
