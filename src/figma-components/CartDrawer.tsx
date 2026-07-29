'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useDrawer } from "./DrawerContext";
import { useCartStore } from "@/lib/store/cart-store";
import imgImage114 from "@/imports/Cart/71b3cd582dab7174e13346a8d88abe33548d2aa7.png";

function ProductImage({ src }: { src?: string | null }) {
  const imgSrc = src || (typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src);
  return (
    <div className="bg-[#f0f0f0] flex h-[137px] items-center justify-center overflow-hidden shrink-0 w-[120px]">
      <div className="relative" style={{ width: "116.17%", height: "100%" }}>
        <img alt="product" className="absolute h-full object-cover top-0" style={{ left: "-8.01%", width: "116.17%" }} src={imgSrc} />
      </div>
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
            className="bg-white h-full shrink-0 w-[560px] overflow-hidden flex flex-col justify-between"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col justify-between p-[20px] size-full">
              {/* Top: header + items */}
              <div className="flex flex-col gap-[20px] items-start w-full overflow-y-auto max-h-[calc(100vh-140px)]">
                {/* Header */}
                <div className="flex items-center justify-between w-full shrink-0">
                  <p className="font-sans leading-[28px] text-[20px] text-[#1a1a1a] whitespace-nowrap font-normal">
                    Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
                  </p>
                  <div className="flex gap-[20px] items-center">
                    {items.length > 0 && (
                      <p
                        onClick={clearCart}
                        className="font-sans text-[17px] tracking-[-0.085px] underline text-[#1c1c1c] cursor-pointer"
                      >
                        Clear All
                      </p>
                    )}
                    <button onClick={handleClose} className="shrink-0 size-[20px] cursor-pointer" aria-label="Close cart">
                      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                        <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                        <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center w-full py-[80px] text-[#808080]">
                    <p className="font-sans text-[18px]">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div key={item.product.id} className="w-full flex flex-col gap-[20px]">
                      {index > 0 && <div className="w-full h-px bg-[#E2E2E2] shrink-0" />}
                      <div className="flex gap-[16px] items-start w-full shrink-0">
                        <ProductImage src={item.product.imageUrl} />
                        <div className="flex-1 flex flex-col justify-between py-[3px] self-stretch min-w-0">
                          <div className="flex items-start justify-between w-full whitespace-nowrap leading-[24px] text-[#1c1c1c]">
                            <div className="font-sans flex flex-col items-start shrink-0">
                              <p className="text-[17px] font-medium tracking-[-0.34px]">{item.product.name}</p>
                              {item.product.color && <p className="text-[17px] tracking-[-0.085px]">Color: {item.product.color}</p>}
                              {item.product.size && <p className="text-[17px] tracking-[-0.085px]">Size: {item.product.size}</p>}
                            </div>
                            <p className="font-sans text-[17px] font-medium shrink-0">{item.product.price}</p>
                          </div>
                          <div className="flex items-center justify-between w-full shrink-0">
                            <div className="flex gap-[16px] items-center">
                              <button
                                type="button"
                                disabled={item.quantity <= 1}
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className={`size-[20px] flex items-center justify-center transition-opacity ${
                                  item.quantity <= 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-75"
                                }`}
                                aria-label="Decrease quantity"
                              >
                                <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                                  <path d="M2.92893 10H17.0711" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                                </svg>
                              </button>
                              <p className="font-sans leading-[20px] text-[17px] tracking-[-0.34px] text-[#1c1c1c]">
                                {item.quantity}
                              </p>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="size-[20px] flex items-center justify-center cursor-pointer"
                              >
                                <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                                  <path d="M10 2.92893V17.0711" stroke="black" strokeLinejoin="round" strokeWidth="1.2" />
                                  <path d="M2.92893 10H17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                            <p
                              onClick={() => removeItem(item.product.id)}
                              className="font-sans leading-[24px] text-[17px] tracking-[-0.085px] underline text-[#1c1c1c] cursor-pointer"
                            >
                              Remove
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom: subtotal + checkout */}
              <div className="flex flex-col gap-[20px] items-start w-full shrink-0 pt-[20px] border-t border-[#e2e2e2]">
                <div className="flex items-center justify-between w-full text-[#1c1c1c] text-[20px] font-medium tracking-[-0.4px] leading-[24px] whitespace-nowrap">
                  <p className="font-sans font-medium text-[20px]">Subtotal</p>
                  <p className="font-sans font-medium text-[20px]">৳{subtotal.toFixed(0)} BDT</p>
                </div>
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={handleCheckout}
                  className={`bg-[#050505] w-full flex items-center justify-center px-[20px] py-[12px] transition-opacity ${
                    items.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
                  }`}
                >
                  <p className="font-sans leading-[24px] text-[17px] text-white whitespace-nowrap">
                    Checkout
                  </p>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
