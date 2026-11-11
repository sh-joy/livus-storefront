'use client';

import { Minus, Plus } from 'lucide-react';
import { useStoreSettings, freeDeliveryThreshold } from '@/lib/hooks/use-store-settings';

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ProductCard } from '@/figma-components/ProductCard';
import { SmartImage } from '@/components/storefront/SmartImage';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SizingGuideModal } from '@/figma-components/SizingGuideModal';
import { useDrawer } from '@/figma-components/DrawerContext';
import { useCartStore } from '@/lib/store/cart-store';
import type { ProductItem } from '@/app/actions/products';
import { generateCleanSku } from '@/lib/utils';
import imgImage115 from "./147bb3d7a50a487cfcb2163c878fc1a5c25e19e6.png";
import imgImage114 from "./71b3cd582dab7174e13346a8d88abe33548d2aa7.png";
import imgFrame1597881192 from "./cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png";

const defaultColorVariants = [
  {
    name: "Yellow",
    isLowStock: true,
    thumbnail: typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src,
    images: [
      typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src,
      typeof imgImage115 === 'string' ? imgImage115 : imgImage115?.src,
      typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src,
    ],
    sizes: [
      { size: "S", quantity: 10, isStockOut: false },
      { size: "M", quantity: 10, isStockOut: false },
      { size: "XL", quantity: 5, isStockOut: false },
      { size: "XXL", quantity: 0, isStockOut: true },
    ],
  },
  {
    name: "Black",
    isLowStock: false,
    thumbnail: typeof imgImage115 === 'string' ? imgImage115 : imgImage115?.src,
    images: [
      typeof imgImage115 === 'string' ? imgImage115 : imgImage115?.src,
      typeof imgImage114 === 'string' ? imgImage114 : imgImage114?.src,
      typeof imgFrame1597881192 === 'string' ? imgFrame1597881192 : imgFrame1597881192?.src,
    ],
    sizes: [
      { size: "S", quantity: 10, isStockOut: false },
      { size: "M", quantity: 10, isStockOut: false },
      { size: "XL", quantity: 5, isStockOut: false },
      { size: "XXL", quantity: 0, isStockOut: true },
    ],
  },
];

export interface ProductDetailsProps {
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    specifications: string;
    collectionTag: string;
    categorySlug?: string;
    priceBdt: number;
    compareAtPriceBdt?: number;
    colorVariants: {
      id: string;
      name: string;
      hexColor: string;
      thumbnailUrl: string;
      isLowStock: boolean;
      galleryImages: string[];
      sizes: { size: string; sku: string | null; quantity: number; isStockOut: boolean }[];
    }[];
  };
  allProducts?: ProductItem[];
}

function parseSpecificationsText(raw?: string, defaultDesc?: string): string {
  if (!raw) return defaultDesc || "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.specificationsText === "string") {
      return parsed.specificationsText;
    }
  } catch (e) {}
  return raw;
}

function renderFormattedMarkdown(text: string) {
  if (!text) return null;
  const paragraphs = text.split("\n");
  return paragraphs.map((para, idx) => {
    if (!para.trim()) return <div key={idx} className="h-1.5" />;
    
    const parts = para.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={idx} className="mb-1.5 leading-[20px] text-[14px] text-[#1c1c1c]">
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-medium text-black">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export default function ProductDetails({ product, allProducts = [] }: ProductDetailsProps) {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const freeOver = freeDeliveryThreshold(useStoreSettings());
  const [showGuide, setShowGuide] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);

  // User Telemetry Tracking in localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && product) {
      try {
        const historyRaw = localStorage.getItem("my_store_view_history");
        let history: string[] = historyRaw ? JSON.parse(historyRaw) : [];
        history = [product.slug, ...history.filter((s) => s !== product.slug)].slice(0, 10);
        localStorage.setItem("my_store_view_history", JSON.stringify(history));

        if (product.collectionTag) {
          const affinityRaw = localStorage.getItem("my_store_category_affinity");
          let affinity: Record<string, number> = affinityRaw ? JSON.parse(affinityRaw) : {};
          affinity[product.collectionTag] = (affinity[product.collectionTag] || 0) + 1;
          localStorage.setItem("my_store_category_affinity", JSON.stringify(affinity));
        }
      } catch (e) {}
    }
  }, [product?.slug]);

  // Compute 3 Smart Recommended Products
  const [browsing, setBrowsing] = useState<{ views: string[]; affinity: Record<string, number> }>({ views: [], affinity: {} });
  useEffect(() => {
    try {
      const views = JSON.parse(localStorage.getItem("my_store_view_history") || "[]");
      const affinity = JSON.parse(localStorage.getItem("my_store_category_affinity") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrowsing({ views: Array.isArray(views) ? views : [], affinity: affinity && typeof affinity === "object" ? affinity : {} });
    } catch {
      /* storage blocked: recommend without history */
    }
  }, []);

  const recommendedProducts = useMemo(() => {
    const candidates = (allProducts || []).filter(
      (p) => p.slug !== product?.slug && p.id !== product?.id
    );

    if (candidates.length === 0) return [];

    // Browsing history is read after the first render (see effect below) so server and browser agree.
    const userViewHistory = browsing.views;
    const userCategoryAffinity = browsing.affinity;

    const scored = candidates.map((p) => {
      let score = 0;

      // 1. Collection Tag Match (+40 pts)
      if (product?.collectionTag && p.collectionTag && product.collectionTag === p.collectionTag) {
        score += 40;
      }

      // 2. Gender Category Match (+30 pts)
      if (product?.categorySlug && p.categorySlug && product.categorySlug === p.categorySlug) {
        score += 30;
      }

      // 3. User History & Behavioral Affinity (+25 pts)
      if (p.collectionTag && userCategoryAffinity[p.collectionTag]) {
        score += Math.min(25, userCategoryAffinity[p.collectionTag] * 5);
      }
      if (userViewHistory.includes(p.slug)) {
        score += 15;
      }

      // 4. Price Point Proximity (+15 pts)
      if (product?.priceBdt && p.priceBdt) {
        const ratio = p.priceBdt / product.priceBdt;
        if (ratio >= 0.7 && ratio <= 1.3) {
          score += 15;
        }
      }

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((item) => item.product);
  }, [product?.slug, product?.collectionTag, product?.categorySlug, product?.priceBdt, allProducts, browsing]);

  const { openCart: openCartDrawer } = useDrawer();
  const addItemToCart = useCartStore((state) => state.addItem);

  // Determine active dynamic or default product data
  const productName = product?.name || 'Oakwood Long sleeve';
  const priceBdt = product ? `৳${product.priceBdt} BDT` : '৳899 BDT';
  const compareAtPriceBdt = product?.compareAtPriceBdt ? `৳${product.compareAtPriceBdt}` : (product ? undefined : '৳1199');

  // Format Color Variants
  const activeColorVariants = (product?.colorVariants && product.colorVariants.length > 0)
    ? product.colorVariants.map((v) => {
        const thumb = v.thumbnailUrl || '/images/for_him.jpg';
        const gallery = (v.galleryImages && v.galleryImages.filter(Boolean).length > 0)
          ? v.galleryImages.filter(Boolean)
          : [thumb];

        return {
          name: v.name,
          isLowStock: v.isLowStock,
          thumbnail: thumb,
          images: gallery,
          sizes: v.sizes,
        };
      })
    : defaultColorVariants;

  const activeColor = activeColorVariants[selectedColorIdx] || activeColorVariants[0];
  const activeSizeObj = (activeColor?.sizes || []).find((s: any) => s.size === selectedSize);
  const activeSku = (activeSizeObj as any)?.sku || generateCleanSku(productName, selectedSize);
  const activeGallery = (activeColor && activeColor.images && activeColor.images.length > 0)
    ? activeColor.images
    : [activeColor?.thumbnail || '/images/for_him.jpg'];

  const currentImage = activeGallery[currentImageIdx] || activeGallery[0] || activeColor?.thumbnail || '/images/for_him.jpg';

  const [prevImage, setPrevImage] = useState<string>(currentImage);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstRender(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentImage !== prevImage) {
      const timer = setTimeout(() => {
        setPrevImage(currentImage);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentImage]);

  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());

  // Auto-slide image timer (8 seconds after user inactivity)
  useEffect(() => {
    if (activeGallery.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % activeGallery.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeGallery.length, selectedColorIdx, lastInteractionTime]);

  // Sizes this colour actually carries (falls back to the standard run when stock isn't tracked)
  const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const colorSizes: { size: string; quantity: number; isStockOut: boolean }[] = activeColor?.sizes || [];
  const availableSizes = colorSizes.length > 0
    ? [...colorSizes.map((s) => s.size)].sort((a, b) => {
        const ia = SIZE_ORDER.indexOf(a.toUpperCase());
        const ib = SIZE_ORDER.indexOf(b.toUpperCase());
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : ["S", "M", "L", "XL"];
  const isSizeOut = (sz: string) => {
    const o = colorSizes.find((s) => s.size === sz);
    return o ? o.isStockOut || o.quantity <= 0 : false;
  };
  const selectedSizeObj = colorSizes.find((s) => s.size === selectedSize);
  const maxQty = selectedSizeObj ? Math.max(0, Math.min(99, selectedSizeObj.quantity)) : 99;
  const allSoldOut = colorSizes.length > 0 && colorSizes.every((s) => s.isStockOut || s.quantity <= 0);
  const canAddToCart = !!selectedSize && !isSizeOut(selectedSize) && quantity <= maxQty && !allSoldOut;

  // Default to the first in-stock size whenever the colour changes (or the current one isn't valid)
  useEffect(() => {
    if (selectedSize && availableSizes.includes(selectedSize) && !isSizeOut(selectedSize)) return;
    const firstInStock = availableSizes.find((sz) => !isSizeOut(sz)) || "";
    setSelectedSize(firstInStock);
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorIdx, product?.id]);

  // Keep quantity within stock for the chosen size
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) setQuantity(maxQty);
  }, [maxQty, quantity]);

  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    setCurrentImageIdx(0);
    setLastInteractionTime(Date.now());
    galleryRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const [addedFlash, setAddedFlash] = useState(false);
  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItemToCart(
      {
        id: `${product?.slug || 'oakwood-long-sleeve'}-${activeColor.name.toLowerCase()}`,
        productId: product?.id,
        slug: product?.slug,
        name: productName,
        price: priceBdt,
        color: activeColor.name,
        size: selectedSize,
        imageUrl: activeGallery[0] || currentImage,
      },
      quantity
    );
    openCartDrawer();
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1500);
  };

  // Mobile swipe gallery: track which photo is in view for the dot indicator
  const galleryRef = useRef<HTMLDivElement>(null);
  const [mobileSlide, setMobileSlide] = useState(0);
  const handleGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || el.clientWidth === 0) return;
    setMobileSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  const formattedDescriptionText = parseSpecificationsText(product?.specifications, product?.description);

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full min-h-screen font-sans" data-name="Product Details">
      <SiteNav />
      <SizingGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        sizeMatrix={(product as any)?.sizeMatrix}
        productName={productName}
      />

      {/* Main Product Hero Grid (#product-single) */}
      <div
        id="product-single"
        className="w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] items-start relative shrink-0"
      >
        
        {/* Left: 1.5fr Stacked Vertical Image Gallery (.product-single__medias) */}
        <div className="relative w-full">
        <div
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          className="product-single__medias w-full flex flex-col gap-4 max-lg:flex-row max-lg:gap-0 max-lg:overflow-x-auto max-lg:snap-x max-lg:snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {activeGallery.map((imgUrl, idx) => (
            <div
              key={`${selectedColorIdx}-${idx}`}
              className="w-full aspect-[3/4] max-lg:min-w-full max-lg:snap-center bg-[#f0f0f0] relative overflow-hidden shrink-0"
            >
              <SmartImage
                alt={`${productName} - View ${idx + 1}`}
                fill
                // Gallery column is 1.5fr of 2.5fr (60vw) at lg+, full width below
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover z-10"
                src={imgUrl}
                fallbackSrc="/images/for_him.jpg"
                {...(idx === 0 ? { preload: true } : { loading: 'lazy' as const })}
              />
            </div>
          ))}
        </div>
        {activeGallery.length > 1 && (
          <div className="lg:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-[6px] z-20 pointer-events-none">
            {activeGallery.map((_, idx) => (
              <span
                key={idx}
                className={`h-[3px] w-[18px] transition-colors ${idx === mobileSlide ? "bg-black" : "bg-black/25"}`}
              />
            ))}
          </div>
        )}
        </div>

        {/* Right: 1fr Sticky Product Details Panel (Stays sticky at top 98px, ghost-scrolls through tall content with vertical fade mask) */}
        <div
          className="product-single__panel w-full lg:sticky lg:top-[98px] flex items-start justify-center p-[36px] max-md:px-[16px] max-md:pt-[24px] shrink-0 self-start pb-12 z-20 lg:overflow-y-auto lg:max-h-[calc(100vh-120px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="content-stretch flex flex-col gap-6 items-start relative shrink-0 w-full max-w-[460px]">
            
            {/* Header Title & Price */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] max-md:gap-[10px] items-start relative shrink-0 w-full">
                <h1
                  className="font-serif font-semibold relative shrink-0 text-[#1c1c1c]"
                  style={{
                    fontFamily: "'Overused Grotesk', sans-serif",
                    fontSize: "28px",
                    lineHeight: "32px",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {productName}
                </h1>
                <div className="content-stretch flex flex-wrap font-sans gap-[8px] items-start leading-[24px] relative shrink-0 whitespace-nowrap">
                  <p className="relative shrink-0 text-[#1c1c1c] text-[24px] font-medium">
                    {priceBdt}
                  </p>
                  {compareAtPriceBdt && (
                    <p className="line-through relative shrink-0 text-[#666666] text-[18px] font-medium">
                      {compareAtPriceBdt}
                    </p>
                  )}
                </div>
                <p className="text-[14px] text-[#666666] font-normal leading-[20px] font-sans">
                  SKU: {activeSku}
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-full">
                <div className="absolute inset-[-1px_0_0_0]">
                  <svg className="block size-full" fill="none" height="1" preserveAspectRatio="none" viewBox="0 0 460 1" width="460">
                    <line id="Line 1" stroke="var(--stroke-0, #E2E2E2)" x2="460" y1="0.5" y2="0.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Colour */}
            <div className="flex flex-col gap-3 w-full">
              <p className="t-body m-0 text-[#1c1c1c]" style={{ fontWeight: 500 }}>
                Color: <span className="text-[#5c5c5c]" style={{ fontWeight: 400 }}>{activeColor.name}</span>
                {activeColor.isLowStock && (
                  <span className="text-[#d4183d] text-[14px] ml-2">Low stock</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1 -ml-[3px]">
                {activeColorVariants.map((c: any, idx) => {
                  const isSelected = selectedColorIdx === idx;
                  const hex = c.hexCode || c.hexColor || (
                    c.name.toLowerCase().includes("bronze") || c.name.toLowerCase().includes("brown") ? "#4a2e18" :
                    c.name.toLowerCase().includes("slate") || c.name.toLowerCase().includes("gray") || c.name.toLowerCase().includes("grey") ? "#716e8d" :
                    c.name.toLowerCase().includes("yellow") || c.name.toLowerCase().includes("mustard") ? "#eab308" :
                    c.name.toLowerCase().includes("pink") || c.name.toLowerCase().includes("rose") ? "#f4d0d0" :
                    c.name.toLowerCase().includes("blue") || c.name.toLowerCase().includes("navy") ? "#1e3a8a" :
                    c.name.toLowerCase().includes("black") ? "#18181b" :
                    c.name.toLowerCase().includes("white") || c.name.toLowerCase().includes("cream") ? "#ffffff" : "#64748b"
                  );
                  return (
                    <button
                      key={c.name || idx}
                      type="button"
                      onClick={() => handleSelectColor(idx)}
                      title={c.name}
                      aria-label={`Color ${c.name}`}
                      aria-pressed={isSelected}
                      className={`size-10 p-[3px] border cursor-pointer bg-white transition-colors ${isSelected ? "border-[#0d0d0d]" : "border-transparent hover:border-[#c8c8c8]"}`}
                    >
                      <span className="block size-full border border-black/10" style={{ backgroundColor: hex }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size */}
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between">
                <p className="t-body m-0 text-[#1c1c1c]" style={{ fontWeight: 500 }}>
                  Size{selectedSize ? <span className="text-[#5c5c5c]" style={{ fontWeight: 400 }}>: {selectedSize}</span> : null}
                </p>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="t-small text-[#5c5c5c] underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer hover:text-black"
                >
                  Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const isStockOut = isSizeOut(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isStockOut}
                      aria-pressed={isSelected}
                      onClick={() => { if (!isStockOut) { setSelectedSize(sz); setQuantity(1); } }}
                      className={`h-11 flex-1 min-w-[48px] max-w-[76px] px-2 flex items-center justify-center border text-[15px] tracking-[0.04em] font-sans transition-colors ${
                        isStockOut
                          ? "border-[#ececec] text-[#b0b0b0] line-through cursor-not-allowed bg-[#fafafa]"
                          : isSelected
                          ? "border-[#0d0d0d] bg-[#0d0d0d] text-white cursor-pointer"
                          : "border-[#e2e2e2] text-[#1a1a1a] bg-white hover:border-[#0d0d0d] cursor-pointer"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between w-full">
              <p className="t-body m-0 text-[#1c1c1c]" style={{ fontWeight: 500 }}>Quantity</p>
              <div className="flex items-center border border-[#e2e2e2] h-11">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="size-11 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                >
                  <Minus className="size-4 stroke-[1.5]" aria-hidden />
                </button>
                <span className="t-body w-10 text-center tabular-nums text-[#1c1c1c]" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxQty}
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  className="size-11 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f5f5]"
                >
                  <Plus className="size-4 stroke-[1.5]" aria-hidden />
                </button>
              </div>
            </div>

            {/* Primary Add to Cart Button */}
            {selectedSizeObj && selectedSizeObj.quantity > 0 && selectedSizeObj.quantity <= 5 && (
              <p className="font-sans text-[15px] text-[#d4183d] -mt-[12px]">Only {selectedSizeObj.quantity} left in size {selectedSize}</p>
            )}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`lv-btn lv-btn--block ${
                canAddToCart
                  ? "lv-btn--solid cursor-pointer"
                  : "!border-neutral-300 !bg-neutral-100 !text-neutral-400 cursor-not-allowed"
              }`}
            >
              <p className="m-0">
                {allSoldOut ? "SOLD OUT" : !selectedSize ? "SELECT A SIZE" : addedFlash ? "ADDED ✓" : "ADD TO CART"}
              </p>
            </button>

            {/* Description + shipping accordions: one group, equal rows */}
            <div className="w-full border-t border-neutral-200 -mt-2">
            {/* Collapsible Product Description Accordion */}
            <div className="w-full border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                className="w-full min-h-14 flex items-center justify-between gap-4 py-3 text-left bg-transparent border-none cursor-pointer group"
              >
                <span className="font-sans text-[14px] uppercase tracking-[0.08em] text-[#1c1c1c]" style={{ fontWeight: 500 }}>
                  Product Description &amp; Specifications
                </span>
                <span className="font-sans text-[20px] font-normal text-neutral-600 group-hover:text-black transition-colors">
                  {isDescriptionExpanded ? "−" : "+"}
                </span>
              </button>

              <AnimatePresence>
                {isDescriptionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="font-sans text-[15px] text-[#3a3a3a] leading-relaxed space-y-3 pb-5">
                      {renderFormattedMarkdown(formattedDescriptionText)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapsible Shipping, Delivery & Returns Accordion */}
            <div className="w-full border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setIsShippingExpanded((prev) => !prev)}
                className="w-full min-h-14 flex items-center justify-between gap-4 py-3 text-left bg-transparent border-none cursor-pointer group"
              >
                <span className="font-sans text-[14px] uppercase tracking-[0.08em] text-[#1c1c1c]" style={{ fontWeight: 500 }}>
                  Shipping, Delivery &amp; Returns
                </span>
                <span className="font-sans text-[20px] font-normal text-neutral-600 group-hover:text-black transition-colors">
                  {isShippingExpanded ? "−" : "+"}
                </span>
              </button>

              <AnimatePresence>
                {isShippingExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="font-sans text-[15px] text-[#3a3a3a] leading-relaxed space-y-3 pb-5">
                      <p><strong>Nationwide Delivery in Bangladesh:</strong> Standard delivery within 2–3 business days inside Dhaka Division (৳100) and 3–5 days across all other divisions (৳150).</p>
                      {freeOver > 0 && (
                        <p><strong>Free Delivery:</strong> All orders of ৳{freeOver.toLocaleString()} BDT or more qualify for free nationwide delivery.</p>
                      )}
                      <p><strong>Easy 7-Day Exchange:</strong> Size or fit issues? We offer a hassle-free 7-day exchange window on all unworn items with original tags attached.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* "You might also like" Section Heading & Smart Recommendation Grid */}
      {recommendedProducts.length > 0 && (
        <>
          <div className="w-full px-[var(--lv-gutter)] pt-[clamp(48px,6vw,88px)] pb-8 shrink-0">
            <h2 className="t-h2 m-0">
              You might also like
            </h2>
          </div>

          <div className="relative shrink-0 w-full pb-[56px] max-md:pb-[32px]">
            <div className="gap-x-[24px] max-md:gap-x-[12px] gap-y-[60px] max-md:gap-y-[32px] grid grid-cols-2 md:grid-cols-3 md:[&>*:nth-child(4)]:hidden px-[36px] max-md:px-[16px] relative size-full">
              {recommendedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </>
      )}

      <SiteFooter />
    </div>
  );
}
