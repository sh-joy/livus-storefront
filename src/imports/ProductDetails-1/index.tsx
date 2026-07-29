'use client';

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SizingGuideModal } from '@/figma-components/SizingGuideModal';
import { useDrawer } from '@/figma-components/DrawerContext';
import imgImage115 from "./147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";
import imgImage114 from "./71b3cd582dab7174e13346a8d88abe33548d2aa7.png";
import imgFrame1597881192 from "./cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png";

// Swatch color variants
const colors = [
  { name: "Yellow", img: typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src },
  { name: "Black", img: typeof imgImage115 === 'string' ? imgImage115 : imgImage115?.src },
  { name: "Grey", img: typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src },
];

export default function ProductDetails() {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize]         = useState("XL");
  const [quantity, setQuantity]                 = useState(3);
  const [showGuide, setShowGuide]               = useState(false);

  // Custom "DRAG ->" cursor state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { openCart } = useDrawer();

  // Out of stock sizes logic
  const stockOutSizes = ["XXL"];
  const sizes = ["S", "M", "XL", "XXL"];

  const activeColor = colors[selectedColorIdx];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleNextImage = () => {
    setSelectedColorIdx((prev) => (prev + 1) % colors.length);
  };

  const handleAddToCart = () => {
    openCart();
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full min-h-screen" data-name="Product Details">
      <SiteNav />
      <SizingGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Main Product Hero Grid: 1.5fr on left, 1fr on right, items-center */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] items-center relative shrink-0">
        
        {/* Left: 1.5fr Image Container with unconstrained height & custom "DRAG ->" cursor */}
        <div
          ref={imageContainerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHoveringImage(true)}
          onMouseLeave={() => setIsHoveringImage(false)}
          onClick={handleNextImage}
          className="w-full aspect-square bg-[#f0f0f0] relative overflow-hidden shrink-0 cursor-none group select-none"
        >
          {/* Main Display Image */}
          <motion.img
            key={activeColor.img}
            alt="Oakwood Long sleeve"
            className="absolute inset-0 size-full object-cover"
            src={activeColor.img}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Web Custom Floating Larger "DRAG ->" Circle Cursor with Arrow */}
          <AnimatePresence>
            {isHoveringImage && (
              <motion.div
                className="pointer-events-none absolute z-30 flex items-center justify-center gap-[6px] rounded-full bg-[#050505] text-white size-[88px] shadow-xl -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 22, stiffness: 320 }}
              >
                <span className="font-sans text-[14px] font-semibold uppercase tracking-[1px] text-white">
                  DRAG
                </span>
                <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Center Pagination Indicators (Corner radius 0, Active color BLACK #050505) */}
          <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-20 flex gap-[6px] items-center">
            {colors.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIdx(idx);
                }}
                className={`h-[6px] transition-all duration-300 cursor-pointer rounded-none ${
                  selectedColorIdx === idx
                    ? "w-[24px] bg-[#050505]"
                    : "w-[16px] bg-[#d0d0d0] hover:bg-neutral-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: 1fr Product Details Panel (Aligned Vertically Center) */}
        <div className="w-full flex items-center justify-center p-[36px] shrink-0">
          <div className="content-stretch flex flex-col gap-[28px] items-start relative shrink-0 w-full max-w-[460px]">
            
            {/* Header Title & Price */}
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full whitespace-nowrap">
                <p className="font-serif font-semibold leading-[36px] relative shrink-0 text-[#1c1c1c] text-[32px] tracking-[-0.64px]">
                  Oakwood Long sleeve
                </p>
                <div className="content-stretch flex font-sans gap-[8px] items-start leading-[24px] relative shrink-0">
                  <p className="relative shrink-0 text-[#1c1c1c] text-[24px] font-medium">
                    ৳899 BDT
                  </p>
                  <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">
                    ৳1199
                  </p>
                </div>
              </div>
              <div className="h-0 relative shrink-0 w-full">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" height="1" preserveAspectRatio="none" viewBox="0 0 460 1" width="460">
                    <line id="Line 1" stroke="var(--stroke-0, #E2E2E2)" x2="460" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#1c1c1c] text-[17px] tracking-[-0.34px] whitespace-nowrap">
                Color: <span className="font-medium">{activeColor.name}</span>
              </p>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
                {colors.map((c, idx) => (
                  <div
                    key={c.name}
                    onClick={() => setSelectedColorIdx(idx)}
                    className={`bg-[#f0f0f0] content-stretch flex h-[90px] items-center justify-center relative shrink-0 w-[80px] cursor-pointer transition-all overflow-hidden ${
                      selectedColorIdx === idx ? "border-2 border-black scale-105" : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img alt={c.name} className="size-full object-cover" src={c.img} />
                  </div>
                ))}
              </div>
            </div>

            {/* Size Selection & Sizing Guide */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col font-sans items-start leading-[24px] not-italic relative shrink-0 whitespace-nowrap">
                <p className="relative shrink-0 text-[#1c1c1c] text-[17px] tracking-[-0.34px] font-medium">Size</p>
                <p
                  onClick={() => setShowGuide(true)}
                  className="[text-underline-position:from-font] decoration-from-font decoration-solid relative shrink-0 text-[#676767] text-[15px] tracking-[-0.3px] underline cursor-pointer hover:text-black transition-colors"
                >
                  View Guide
                </p>
              </div>
              <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
                {sizes.map((sz) => {
                  const isStockOut = stockOutSizes.includes(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isStockOut}
                      onClick={() => !isStockOut && setSelectedSize(sz)}
                      className={`content-stretch flex items-center justify-center px-[2px] relative shrink-0 ${
                        isStockOut
                          ? "line-through opacity-40 cursor-not-allowed text-[#a0a0a0]"
                          : isSelected
                          ? "border-b border-black text-[#1a1a1a] font-medium cursor-pointer"
                          : "text-[#606060] hover:text-black cursor-pointer"
                      }`}
                    >
                      <p className="font-sans leading-[24px] text-[17px] tracking-[0.17px]">{sz}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#1c1c1c] text-[17px] tracking-[-0.34px] whitespace-nowrap font-medium">Quantity</p>
              <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`size-[20px] flex items-center justify-center transition-opacity ${
                    quantity <= 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-75"
                  }`}
                >
                  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                    <path d="M2.92893 10H17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </button>
                <p className="font-sans leading-[20px] text-[17px] tracking-[-0.34px] text-[#1c1c1c] font-medium min-w-[20px] text-center">
                  {quantity}
                </p>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="size-[20px] flex items-center justify-center cursor-pointer hover:opacity-75"
                >
                  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" className="block size-full">
                    <path d="M10 2.92893V17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M2.92893 10H17.0711" stroke="black" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Primary Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="group relative shrink-0 w-full border border-black bg-transparent py-[14px] px-[20px] cursor-pointer transition-all duration-200 hover:bg-[#050505]"
            >
              <p className="font-sans leading-[24px] text-[17px] text-black group-hover:text-white uppercase tracking-[0.85px] font-medium transition-colors">
                Add to cart
              </p>
            </button>

            {/* Description */}
            <div className="[word-break:break-word] font-sans leading-[0] not-italic relative shrink-0 text-[17px] text-black w-full whitespace-pre-wrap">
              <p className="leading-[24px] mb-0">Ultralight recycled mesh long sleeve in race fit with bonded seams and a silicone logo. For a more relaxed fit, we recommend taking one size up in this style.</p>
              <p className="leading-[24px] mb-0">​</p>
              <p className="leading-[24px]">
                - Silicone heat press labels<br aria-hidden />- 95 GSM<br aria-hidden />- 92% recycled Polyester + 15% Elastane<br aria-hidden />- Made in Bangladesh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* "You might also like" Section Heading (120px padding-top) */}
      <div className="w-full px-[36px] pt-[120px] pb-[32px] shrink-0">
        <h2 className="font-serif text-[36px] font-semibold tracking-[-0.72px] text-[#1c1c1c] leading-[44px]">
          You might also like
        </h2>
      </div>

      {/* Product Recommendation Grid */}
      <div className="relative shrink-0 w-full pb-[100px]">
        <div className="gap-x-[8px] gap-y-[60px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[repeat(1,fit-content(100%))] px-[36px] relative size-full">
          {/* Card 1 */}
          <div data-product-card="true" className="group content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
            <div className="aspect-[3/4] relative shrink-0 w-full overflow-hidden">
              <img alt="OWAYO - CROSS FADE" className="absolute inset-0 max-w-none object-cover size-full group-hover:scale-105 transition-transform duration-300" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
              <div className="content-stretch flex items-start p-[16px] relative size-full">
                <div className="bg-[#050505] content-stretch flex items-center justify-center pb-[4px] pt-[3px] px-[10px] relative shrink-0">
                  <p className="font-sans leading-[24px] text-[16px] text-white whitespace-nowrap">10% OFF</p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
              <p className="font-sans relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
                <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]">৳899 BDT</p>
                <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">৳1199 BDT</p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div data-product-card="true" className="group content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
            <div className="aspect-[3/4] relative shrink-0 w-full overflow-hidden">
              <img alt="OWAYO - CROSS FADE" className="absolute inset-0 max-w-none object-cover size-full group-hover:scale-105 transition-transform duration-300" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
            </div>
            <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
              <p className="font-sans relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
                <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]">৳899 BDT</p>
                <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">৳1199 BDT</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div data-product-card="true" className="group content-stretch flex flex-col gap-[16px] items-start justify-self-stretch relative self-start shrink-0 cursor-pointer hover:opacity-95 transition-all">
            <div className="aspect-[3/4] relative shrink-0 w-full overflow-hidden">
              <img alt="OWAYO - CROSS FADE" className="absolute inset-0 max-w-none object-cover size-full group-hover:scale-105 transition-transform duration-300" src={typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src} />
            </div>
            <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-start leading-[24px] px-[8px] relative shrink-0 w-[436px] whitespace-nowrap">
              <p className="font-sans relative shrink-0 text-[#1c1c1c] text-[17px] font-normal tracking-[-0.4px]">OWAYO - CROSS FADE</p>
              <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
                <p className="font-sans font-medium relative shrink-0 text-[#1c1c1c] text-[20px]">৳899 BDT</p>
                <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-normal">৳1199 BDT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
