'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from "next/image";
import type { ProductItem } from '@/app/actions/products';
import { ProductCard } from '@/figma-components/ProductCard';
import { SiteNav } from '@/figma-components/SiteNav';
import { CollectionHeader } from '@/components/storefront/CollectionHeader';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { CategoryFilterSubBar } from '@/figma-components/CategoryFilterSubBar';
import imgFrame1597881192 from '@/imports/ForHim-2/cd8123b8a9ab8a34443daf47f95966a2cb8719ce.png';




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

      <CollectionHeader
        title="Shop All."
        subtitle="Every LIVUS piece in one place — jerseys, shirts, trousers and accessories for him and her."
      />

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
      <div className="h-6 md:h-8" aria-hidden />
      <div className="relative shrink-0 w-full">
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
              className="lv-btn lv-btn--solid mt-6"
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
          <div className="w-full flex items-center justify-center pt-[clamp(28px,3.5vw,40px)]">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="lv-btn lv-btn--outline"
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
