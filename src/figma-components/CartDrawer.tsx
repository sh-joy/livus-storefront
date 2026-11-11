'use client';

import { Minus, Plus } from 'lucide-react';

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";
import { useCartStore, getCartItemKey } from "@/lib/store/cart-store";
import { useStoreSettings, freeDeliveryThreshold } from "@/lib/hooks/use-store-settings";
import imgImage114 from "@/imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";
import { SmartImage } from "@/components/storefront/SmartImage";

function ProductImage({ src }: { src?: string | null }) {
  const imgSrc = src || (typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src);
  return (
    <div className="bg-[#f0f0f0] relative w-[120px] max-md:w-[88px] aspect-[3/4] overflow-hidden shrink-0">
      <SmartImage
        alt=""
        aria-hidden="true"
        fill
        sizes="120px"
        className="object-cover object-center"
        src={imgSrc}
        fallbackSrc="/images/for_him.jpg"
      />
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart } = useDrawer();
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const storeIsOpen = useCartStore((state) => state.isOpen);
  const storeCloseCart = useCartStore((state) => state.closeCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const isVisible = cartOpen || storeIsOpen;
  const threshold = freeDeliveryThreshold(useStoreSettings());

  const handleClose = () => {
    closeCart();
    storeCloseCart();
  };

  const handleCheckout = () => {
    handleClose();
    router.push("/checkout");
  };

  // Calculate dynamic subtotal
  const subtotal = items.reduce((acc, item) => {
    const rawPrice = parseFloat(item.product.price.replace(/[^0-9.]/g, '')) || 0;
    return acc + rawPrice * item.quantity;
  }, 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-start justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white h-full shrink-0 w-[560px] max-w-full overflow-hidden flex flex-col justify-between"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full min-h-0">
              {/* Header: stays at the top */}
              <div className="flex items-center justify-between w-full shrink-0 h-16 px-5 border-b border-[#e2e2e2]">
                <p className="font-sans text-[20px] text-[#1a1a1a] m-0">
                  Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
                </p>
                <div className="flex gap-4 items-center">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[15px] underline underline-offset-4 text-[#5c5c5c] hover:text-black bg-transparent border-none p-0 cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                  <button type="button" onClick={handleClose} className="size-10 -mr-2 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="Close cart">
                    <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-5">
                      <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                      <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Items: the only part that scrolls */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-8 flex flex-col gap-5">
                {/* Items List / Empty State */}
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                    <p className="t-h3 m-0">Your cart is empty</p>
                    <p className="t-body m-0 text-[#5c5c5c]">Find something you love and it will show up here.</p>
                    <Link href="/all-products" onClick={handleClose} className="lv-btn lv-btn--solid mt-3">
                      Shop all products
                    </Link>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const itemKey = getCartItemKey(item.product);
                    return (
                      <div key={itemKey} className="w-full flex flex-col gap-[20px]">
                        {index > 0 && <div className="w-full h-px bg-[#E2E2E2] shrink-0" />}
                        <div className="flex gap-[16px] items-start w-full shrink-0">
                          <ProductImage src={item.product.imageUrl} />
                          <div className="flex-1 flex flex-col justify-between py-[3px] self-stretch min-w-0">
                            <div className="flex items-start justify-between gap-[8px] w-full leading-[24px] text-[#1c1c1c]">
                              <div className="font-sans flex flex-col items-start min-w-0">
                                <p className="text-[16px] font-medium leading-snug">{item.product.name}</p>
                                {item.product.color && <p className="text-[14px] text-[#5c5c5c]">Color: {item.product.color}</p>}
                                {item.product.size && <p className="text-[14px] text-[#5c5c5c]">Size: {item.product.size}</p>}
                              </div>
                              <p className="font-sans text-[16px] font-medium shrink-0 whitespace-nowrap">{item.product.price}</p>
                            </div>
                            <div className="flex items-center justify-between w-full shrink-0">
                              <div className="flex items-center border border-[#e2e2e2] h-10">
                                <button
                                  type="button"
                                  disabled={item.quantity <= 1}
                                  onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                  className="size-10 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="size-4 stroke-[1.5]" aria-hidden />
                                </button>
                                <span className="w-9 text-center text-[16px] tabular-nums text-[#1c1c1c]">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                  className="size-10 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-[#f5f5f5]"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="size-4 stroke-[1.5]" aria-hidden />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(itemKey)}
                                className="text-[15px] underline underline-offset-4 text-[#5c5c5c] hover:text-black bg-transparent border-none p-0 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer: delivery progress, subtotal, checkout */}
              {items.length > 0 && (
                <div className="shrink-0 px-5 pt-4 pb-5 border-t border-[#e2e2e2] flex flex-col gap-4">
                  {threshold > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="t-small m-0 text-[#1a1a1a]">
                        {subtotal >= threshold ? (
                          <span className="text-[#1f7a3a]">You&apos;ve unlocked free delivery</span>
                        ) : (
                          <>Add <strong className="font-semibold">৳{Math.ceil(threshold - subtotal)}</strong> more for free delivery</>
                        )}
                      </p>
                      <div className="w-full h-1 bg-neutral-200 overflow-hidden">
                        <div className="h-full bg-[#0d0d0d] transition-all duration-300" style={{ width: `${Math.min(100, Math.round((subtotal / threshold) * 100))}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between w-full text-[#1c1c1c]">
                    <p className="font-sans text-[18px] font-medium m-0">Subtotal</p>
                    <p className="font-sans text-[18px] font-medium m-0">৳{subtotal.toFixed(0)} BDT</p>
                  </div>
                  <button type="button" onClick={handleCheckout} className="lv-btn lv-btn--solid lv-btn--block">
                    Proceed to checkout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
