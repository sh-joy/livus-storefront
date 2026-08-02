'use client';

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ProductCard } from '@/figma-components/ProductCard';
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
  const [selectedSize, setSelectedSize] = useState("XL");
  const [quantity, setQuantity] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
  const recommendedProducts = useMemo(() => {
    const candidates = (allProducts || []).filter(
      (p) => p.slug !== product?.slug && p.id !== product?.id
    );

    if (candidates.length === 0) return [];

    let userViewHistory: string[] = [];
    let userCategoryAffinity: Record<string, number> = {};

    if (typeof window !== "undefined") {
      try {
        const historyRaw = localStorage.getItem("my_store_view_history");
        if (historyRaw) userViewHistory = JSON.parse(historyRaw);
        const affinityRaw = localStorage.getItem("my_store_category_affinity");
        if (affinityRaw) userCategoryAffinity = JSON.parse(affinityRaw);
      } catch (e) {}
    }

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
    return scored.slice(0, 3).map((item) => item.product);
  }, [product?.slug, product?.collectionTag, product?.categorySlug, product?.priceBdt, allProducts]);

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

  // Active Size List
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    setCurrentImageIdx(0);
    setLastInteractionTime(Date.now());
  };

  const handleAddToCart = () => {
    addItemToCart(
      {
        id: `${product?.slug || 'oakwood-long-sleeve'}-${activeColor.name.toLowerCase()}`,
        name: productName,
        price: priceBdt,
        color: activeColor.name,
        size: selectedSize,
        imageUrl: currentImage,
      },
      quantity
    );
    openCartDrawer();
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
        <div className="product-single__medias w-full flex flex-col gap-4">
          {activeGallery.map((imgUrl, idx) => (
            <div
              key={idx}
              className="w-full aspect-[3/4] bg-[#f0f0f0] relative overflow-hidden shrink-0"
            >
              <img
                alt={`${productName} - View ${idx + 1}`}
                className="absolute inset-0 size-full object-cover z-10"
                src={imgUrl}
                onError={(e) => {
                  e.currentTarget.src = "/images/for_him.jpg";
                }}
              />
            </div>
          ))}
        </div>

        {/* Right: 1fr Sticky Product Details Panel (Stays sticky at top 98px, ghost-scrolls through tall content with vertical fade mask) */}
        <div
          className="w-full lg:sticky lg:top-[98px] flex items-start justify-center p-[36px] shrink-0 self-start pb-12 z-20 overflow-y-auto max-h-[calc(100vh-120px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
          }}
        >
          <div className="content-stretch flex flex-col gap-[28px] items-start relative shrink-0 w-full max-w-[460px]">
            
            {/* Header Title & Price */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full whitespace-nowrap">
                <p
                  className="font-serif font-semibold relative shrink-0 text-[#1c1c1c]"
                  style={{
                    fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                    fontSize: "28px",
                    lineHeight: "32px",
                    fontWeight: 600,
                  }}
                >
                  {productName}
                </p>
                <div className="content-stretch flex font-sans gap-[8px] items-start leading-[24px] relative shrink-0">
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

            {/* Color Swatch Selectors (Right-aligned rectangular color blocks with underline) */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[#1c1c1c] text-[17px] tracking-[-0.34px] whitespace-nowrap font-medium">
                Color: <span className="font-medium">{activeColor.name}</span>
                {activeColor.isLowStock && (
                  <span className="text-[#d4183d] font-medium text-[15px] ml-[6px] tracking-normal font-sans">
                    (Low Stock)
                  </span>
                )}
              </p>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
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
                    <div key={c.name || idx} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectColor(idx)}
                        title={c.name}
                        className="w-10 h-4 relative transition-all cursor-pointer border border-neutral-300/60 shadow-2xs"
                        style={{ backgroundColor: hex }}
                      />
                      <div className={`h-[2px] w-6 transition-all ${isSelected ? "bg-black" : "bg-transparent"}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size Selection & Sizing Guide */}
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="[word-break:break-word] content-stretch flex flex-col font-sans items-start leading-[24px] not-italic relative shrink-0 whitespace-nowrap">
                <p className="relative shrink-0 text-[#1c1c1c] text-[17px] tracking-[-0.34px] font-medium">Size</p>
                <p
                  onClick={() => setShowGuide(true)}
                  className="[text-underline-position:from-font] decoration-from-font decoration-solid relative shrink-0 text-[#676767] text-[15px] tracking-[-0.3px] underline cursor-pointer hover:text-black transition-colors font-medium"
                >
                  View Guide
                </p>
              </div>
              <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
                {availableSizes.map((sz) => {
                  const sizeObj = activeColor.sizes?.find((s: any) => s.size === sz);
                  const isStockOut = sizeObj ? sizeObj.isStockOut || sizeObj.quantity === 0 : sz === "XXL";
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
                          : "text-[#606060] hover:text-black cursor-pointer font-medium"
                      }`}
                    >
                      <p className="font-sans leading-[24px] not-italic relative shrink-0 text-[17px] tracking-[0.17px] whitespace-nowrap font-medium">{sz}</p>
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
              className="group relative shrink-0 w-full border border-black bg-transparent py-[12px] px-[20px] cursor-pointer transition-all duration-200 hover:bg-[#050505]"
            >
              <p className="font-sans leading-[24px] text-[17px] text-black group-hover:text-white uppercase tracking-[0.85px] font-medium transition-colors">
                ADD TO CART
              </p>
            </button>

            {/* Collapsible Product Description Accordion */}
            <div className="w-full border-t border-b border-neutral-200 py-2 mt-2">
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between py-2 text-left cursor-pointer group"
              >
                <span className="font-sans text-[15px] font-medium uppercase tracking-[0.5px] text-[#1c1c1c]">
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
                    <div className="font-sans text-xs text-neutral-800 leading-relaxed space-y-2 pt-3 pb-2 border-t border-neutral-100 mt-1">
                      {renderFormattedMarkdown(formattedDescriptionText)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* "You might also like" Section Heading & Smart Recommendation Grid */}
      {recommendedProducts.length > 0 && (
        <>
          <div className="w-full px-[36px] pt-[100px] pb-[32px] shrink-0">
            <h2 className="font-serif text-[36px] font-semibold tracking-[-0.72px] text-[#1c1c1c] leading-[44px]">
              You might also like
            </h2>
          </div>

          <div className="relative shrink-0 w-full pb-[100px]">
            <div className="gap-x-[24px] gap-y-[60px] grid grid-cols-1 md:grid-cols-3 px-[36px] relative size-full">
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
