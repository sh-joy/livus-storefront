'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ProductItem } from '@/app/actions/products';
import { ProductCard } from '@/figma-components/ProductCard';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { CategoryFilterSubBar } from '@/figma-components/CategoryFilterSubBar';
import svgPaths from '@/imports/ForHim-2/svg-2yu0kgd7y8';
import imgImage116 from '@/imports/ForHim-2/5d3b85b2dc05c72aaa05d18fe3776f4f7f0d88ed.png';
import imgFrame1597881192 from '@/imports/ForHim-2/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png';
import { imgImage115 } from '@/imports/ForHim-2/svg-mkkoy';

function Livus() {
  return (
    <div className="absolute contents inset-[3.96%_2.34%_6.01%_2.6%]" data-name="LIVUS">
      <div className="absolute inset-[3.96%_2.34%_6.01%_76.03%]" data-name="Vector">
        <div className="absolute inset-[-0.15%_-0.33%]">
          <svg className="block size-full" fill="none" height="685.336" preserveAspectRatio="none" viewBox="0 0 304.912 685.336" width="304.912">
            <path d={svgPaths.p1dfd2380} fill="url(#paint0_linear_1_276)" id="Vector" stroke="url(#paint1_linear_1_276)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_276" x1="152.456" x2="152.456" y1="302.464" y2="857.254">
                <stop stopColor="#E6E5E5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_276" x1="152.456" x2="152.456" y1="121.026" y2="501.885">
                <stop stopColor="#B3B3B3" />
                <stop offset="1" stopColor="#626262" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[4.9%_25.16%_6.01%_53.2%]" data-name="Vector">
        <div className="absolute inset-[-0.15%_-0.33%]">
          <svg className="block size-full" fill="none" height="678.227" preserveAspectRatio="none" viewBox="0 0 304.912 678.227" width="304.912">
            <path d={svgPaths.p3ba05f00} fill="url(#paint0_linear_1_264)" id="Vector" stroke="url(#paint1_linear_1_264)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_264" x1="152.456" x2="152.456" y1="299.328" y2="848.346">
                <stop stopColor="#E6E5E5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_264" x1="152.456" x2="152.456" y1="119.778" y2="496.674">
                <stop stopColor="#B3B3B3" />
                <stop offset="1" stopColor="#626262" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[4.9%_47.11%_6.95%_28.81%]" data-name="Vector">
        <div className="absolute inset-[-0.15%_-0.34%]">
          <svg className="block size-full" fill="none" height="671.117" preserveAspectRatio="none" viewBox="0 0 339.435 671.117" width="339.435">
            <path d={svgPaths.p28d26700} fill="url(#paint0_linear_1_262)" id="Vector" stroke="url(#paint1_linear_1_262)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_262" x1="169.717" x2="169.717" y1="296.191" y2="839.437">
                <stop stopColor="#E6E5E5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_262" x1="169.717" x2="169.717" y1="118.529" y2="491.463">
                <stop stopColor="#B3B3B3" />
                <stop offset="1" stopColor="#626262" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[4.9%_72.08%_6.95%_21.15%]" data-name="Vector">
        <div className="absolute inset-[-0.15%_-1.05%]">
          <svg className="block size-full" fill="none" height="671.117" preserveAspectRatio="none" viewBox="0 0 96.8245 671.117" width="96.8245">
            <path d={svgPaths.p34d35d10} fill="url(#paint0_linear_1_278)" id="Vector" stroke="url(#paint1_linear_1_278)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_278" x1="48.4123" x2="48.4123" y1="296.191" y2="839.437">
                <stop stopColor="#E6E5E5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_278" x1="48.4123" x2="48.4123" y1="118.529" y2="491.463">
                <stop stopColor="#B3B3B3" />
                <stop offset="1" stopColor="#626262" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute inset-[4.9%_79.43%_6.95%_2.6%]" data-name="Vector">
        <div className="absolute inset-[-0.15%_-0.4%]">
          <svg className="block size-full" fill="none" height="671.117" preserveAspectRatio="none" viewBox="0 0 253.548 671.117" width="253.548">
            <path d={svgPaths.p21b22770} fill="url(#paint0_linear_1_260)" id="Vector" stroke="url(#paint1_linear_1_260)" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_260" x1="126.774" x2="126.774" y1="296.191" y2="839.437">
                <stop stopColor="#E6E5E5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_260" x1="126.774" x2="126.774" y1="118.529" y2="491.463">
                <stop stopColor="#B3B3B3" />
                <stop offset="1" stopColor="#626262" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="-translate-x-1/2 absolute aspect-[949.88671875/1161.09765625] bottom-[-4.47%] contents left-[calc(50%-16.93px)] top-[-27.03%]" data-name="Mask group">
      <div className="-translate-x-1/2 absolute aspect-[949.88671875/1161.09765625] bottom-[-4.47%] left-[calc(50%-16.93px)] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-size-[816.499px_998.051px] top-[-27.03%]" style={{ maskImage: `url("${imgImage115}")` }} data-name="image 115">
        <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={typeof imgImage116 === 'string' ? imgImage116 : imgImage116?.src} />
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="h-[759px] relative shrink-0 w-full">
      <Livus />
      <MaskGroup />
    </div>
  );
}

export default function AllProductsClient({ products = [] }: { products?: ProductItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [sortOption, setSortOption] = useState("");
  const [visibleCount, setVisibleCount] = useState<number>(12); // 4 rows x 3 columns = 12 items initially

  // Backend-connected in-place filtering & multi-metric sorting
  const sortedProducts = useMemo(() => {
    const now = Date.now();

    // 1. Filter by Backend Fields (Gender, Category, Sizes)
    const filtered = (products || []).filter((p) => {
      if (selectedGender !== "all" && p.categorySlug !== selectedGender) return false;
      if (selectedCategory !== "all") {
        const tagMatch = p.collectionTag && p.collectionTag.toLowerCase() === selectedCategory.toLowerCase();
        const catMatch = p.categoryName && p.categoryName.toLowerCase() === selectedCategory.toLowerCase();
        const slugMatch = p.categorySlug && p.categorySlug.toLowerCase() === selectedCategory.toLowerCase();
        if (!tagMatch && !catMatch && !slugMatch) return false;
      }
      if (selectedSize !== "all") {
        if (p.sizes && p.sizes.length > 0) {
          if (!p.sizes.map(s => s.toUpperCase()).includes(selectedSize.toUpperCase())) return false;
        }
      }
      return true;
    });

    // 2. Multi-Metric Sorting Logic (Relevance, Newest, Best Selling, Popular, Price)
    return [...filtered].sort((a, b) => {
      if (sortOption === "relevance") {
        const calcRelevance = (p: ProductItem) => {
          let score = 10;
          if (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt) {
            score += Math.round(((p.compareAtPriceBdt - p.priceBdt) / p.compareAtPriceBdt) * 50);
          }
          if (p.collectionTag === "Minimal" || p.collectionTag === "Divine") {
            score += 15;
          }
          return score;
        };
        return calcRelevance(b) - calcRelevance(a);
      }

      if (sortOption === "newest") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }

      if (sortOption === "best-selling") {
        const discA = a.compareAtPriceBdt && a.compareAtPriceBdt > a.priceBdt ? (a.compareAtPriceBdt - a.priceBdt) / a.compareAtPriceBdt : 0;
        const discB = b.compareAtPriceBdt && b.compareAtPriceBdt > b.priceBdt ? (b.compareAtPriceBdt - b.priceBdt) / b.compareAtPriceBdt : 0;
        return discB - discA;
      }

      if (sortOption === "popular") {
        // Exponential Time-Decay Popularity Algorithm
        const calcPopularity = (p: ProductItem) => {
          let pts = 10;
          if (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt) {
            pts += Math.round(((p.compareAtPriceBdt - p.priceBdt) / p.compareAtPriceBdt) * 30);
          }
          if (p.collectionTag === "Minimal" || p.collectionTag === "Divine") {
            pts += 8;
          }
          const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : now - 86400000 * 7;
          const daysOld = Math.max(0, (now - createdMs) / (1000 * 60 * 60 * 24));
          return pts / Math.pow(daysOld + 2, 1.5);
        };
        return calcPopularity(b) - calcPopularity(a);
      }

      if (sortOption === "low-to-high") {
        return a.priceBdt - b.priceBdt;
      }

      if (sortOption === "high-to-low") {
        return b.priceBdt - a.priceBdt;
      }

      return 0; // Default / Relevance
    });
  }, [products, selectedCategory, selectedGender, selectedSize, sortOption]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative size-full font-sans" data-name="All Products">
      <SiteNav />

      {/* Hero Title & Backdrop Banner */}
      <div className="content-stretch flex flex-col gap-[3px] items-center pt-[0px] relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-center pt-[100px] px-[36px] relative size-full">
              <div className="content-stretch flex flex-[1_0_0] items-end justify-between min-w-px relative">
                <p className="[word-break:break-word] font-serif font-bold leading-[110px] relative shrink-0 text-[110px] text-black tracking-[-3.3px] whitespace-nowrap">
                  Explore All.
                </p>
                <div className="content-stretch flex flex-col items-end justify-center pb-[20px] relative shrink-0 w-[450px]">
                  <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[20px] text-black text-right tracking-[-0.1px] w-full">
                    Explore our complete collection of handcrafted apparel, luxury wear, and modern design drops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Frame10 />
      </div>

      {/* Collection Header & Description */}
      <div className="relative shrink-0 w-full pt-[60px] pb-[20px]">
        <div className="content-stretch flex flex-col gap-[12px] items-start px-[36px] relative size-full">
          <p className="[word-break:break-word] font-serif font-semibold leading-[90px] relative shrink-0 text-[70px] text-black tracking-[-2.1px] whitespace-nowrap">
            All Collections
          </p>
          <p className="[word-break:break-word] font-sans leading-[24px] not-italic relative shrink-0 text-[18px] text-[#505050] tracking-[-0.1px] max-w-[650px]">
            Browse fully customizable templates or draw inspiration from real designs created by our community. Filter by category to find your next look.
          </p>
        </div>
      </div>

      {/* Category Filter Sub-Bar with Rectangular Dropdown Buttons & Product Count */}
      <CategoryFilterSubBar
        totalCount={sortedProducts.length}
        sortOption={sortOption}
        onSortChange={setSortOption}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
      />

      {/* Product Grid */}
      <div className="relative shrink-0 w-full pb-[80px]">
        {visibleProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <p className="text-neutral-500 text-base">No products match your selected filter.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedGender("all");
                setSelectedSize("all");
                setVisibleCount(12);
              }}
              className="mt-4 bg-black text-white px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-wider rounded-none cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="product-grid-4col px-[36px] relative w-full">
            {visibleProducts.map((p, idx) => (
              <ProductCard key={p.id ? `${p.id}-${idx}` : `prod-${idx}`} product={p} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="w-full flex items-center justify-center pt-16 pb-8">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="bg-[#050505] text-white hover:bg-neutral-800 px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-[0.5px] transition-all cursor-pointer rounded-none border border-black shadow-sm"
            >
              LOAD MORE ({visibleProducts.length} OF {sortedProducts.length})
            </button>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
