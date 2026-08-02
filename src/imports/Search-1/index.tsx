'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition, useMemo } from 'react';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SiteNav } from '@/figma-components/SiteNav';
import { ProductCard } from '@/figma-components/ProductCard';
import { CategoryFilterSubBar } from '@/figma-components/CategoryFilterSubBar';
import { getAdminProducts } from '@/app/actions/products';

const CATEGORY_FILTERS = [
  { label: "ALL", value: "ALL" },
  { label: "MINIMAL", value: "minimal" },
  { label: "DIVINE", value: "divine" },
  { label: "FOR HIM", value: "him" },
  { label: "FOR HER", value: "her" },
  { label: "CASUAL", value: "casual" },
  { label: "GAMING", value: "gaming" },
];

/**
 * Smart Recommendation Algorithm (Default State)
 * Ranks products by customer interest, stock availability, discount savings, and tag priority
 */
function calculateRecommendationScore(p: any): number {
  let score = 50;

  const tag = (p.collectionTag || '').toLowerCase();
  if (tag.includes('minimal')) score += 30;
  else if (tag.includes('divine')) score += 25;
  else if (tag.includes('gaming')) score += 20;

  const cat = (p.categoryName || p.categorySlug || '').toLowerCase();
  if (cat.includes('him') || cat.includes('her')) score += 15;

  if (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt) {
    const savings = p.compareAtPriceBdt - p.priceBdt;
    score += Math.min(30, Math.floor(savings / 50));
  }

  if (!p.isLowStock) score += 10;
  if (p.colors && p.colors.length > 1) score += 10;

  return score;
}

/**
 * Search Query Relevance Match Scoring Algorithm
 * Ranks exact title matches highest, followed by category, tags, and color variants
 */
function calculateQueryMatchScore(p: any, q: string): number {
  let score = 0;
  const name = (p.name || '').toLowerCase();
  const slug = (p.slug || '').toLowerCase();
  const tag = (p.collectionTag || '').toLowerCase();
  const cat = (p.categoryName || p.categorySlug || '').toLowerCase();
  const colors = (p.colors || []).map((c: string) => c.toLowerCase());

  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 60;
  else if (name.includes(q)) score += 40;

  if (slug.includes(q)) score += 30;
  if (cat.includes(q)) score += 25;
  if (tag.includes(q)) score += 20;
  if (colors.some((c: string) => c.includes(q))) score += 15;

  return score;
}

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams ? searchParams.get('q') || '' : '';

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const qFromUrl = searchParams ? searchParams.get('q') || '' : '';
    setQuery(qFromUrl);
    setActiveQuery(qFromUrl);
    setVisibleCount(12);
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await getAdminProducts();
        setAllProducts(prods || []);
      } catch (err) {
        console.error("Failed to load search products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveQuery(query);
    setVisibleCount(12);
    startTransition(() => {
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/search');
      }
    });
  };

  const handleClearInput = () => {
    setQuery('');
    setActiveQuery('');
    setVisibleCount(12);
    router.push('/search');
  };

  const handleQuitSearch = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // Algorithmic filtering & recommendation sorting
  const processedProducts = useMemo(() => {
    const q = activeQuery.toLowerCase().trim();
    const cat = selectedCategory.toLowerCase().trim();

    let result = allProducts.filter((p) => {
      if (cat !== 'all') {
        const pCat = (p.categoryName || p.categorySlug || '').toLowerCase();
        const pTag = (p.collectionTag || '').toLowerCase();
        const pType = (p.productType || '').toLowerCase();
        if (!pCat.includes(cat) && !pTag.includes(cat) && !pType.includes(cat)) {
          return false;
        }
      }

      if (!q) return true;
      const matchScore = calculateQueryMatchScore(p, q);
      return matchScore > 0;
    });

    result.sort((a, b) => {
      if (q) {
        return calculateQueryMatchScore(b, q) - calculateQueryMatchScore(a, q);
      } else {
        return calculateRecommendationScore(b) - calculateRecommendationScore(a);
      }
    });

    return result;
  }, [allProducts, activeQuery, selectedCategory]);

  const visibleProducts = processedProducts.slice(0, visibleCount);

  return (
    <div className="bg-white content-stretch flex flex-col items-center pt-0 relative size-full min-h-screen" data-name="Search">
      <SiteNav />

      {/* Search Input Bar */}
      <div className="w-full flex justify-center pt-[40px] pb-[20px] px-[24px]">
        <form
          onSubmit={handleSearchSubmit}
          className="content-stretch flex items-center justify-between pb-[6px] relative w-full max-w-[660px] border-b border-[#e2e2e2]"
        >
          <div className="flex items-center flex-1 gap-[10px] pr-[16px]">
            {query ? (
              <button
                type="button"
                onClick={handleClearInput}
                className="size-[18px] flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none p-0 shrink-0"
                aria-label="Clear input text"
                title="Clear text"
              >
                <svg fill="none" height="18" viewBox="0 0 20 20" width="18" className="block size-full">
                  <path d="M15 5L5 15" stroke="black" strokeLinejoin="round" strokeWidth="1.4" />
                  <path d="M5 5L15 15" stroke="black" strokeLinejoin="round" strokeWidth="1.4" />
                </svg>
              </button>
            ) : (
              <div className="size-[18px] flex items-center justify-center shrink-0 opacity-40">
                <svg fill="none" height="18" viewBox="0 0 24 24" width="18" className="block size-full">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="black" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            )}

            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder="Search by keyword, style, or collection..."
              className="font-sans leading-[28px] text-[#1c1c1c] text-[17px] outline-none border-none bg-transparent flex-1 placeholder:text-[#888888]"
              style={{
                fontFamily: "var(--font-body, 'Barlow Semi Condensed', sans-serif)",
                fontSize: "17px",
                color: "#1c1c1c",
              }}
            />
          </div>

          <div className="flex gap-[12px] items-center shrink-0">
            <button
              type="submit"
              className="bg-[#050505] flex items-center justify-center py-[8px] px-[20px] cursor-pointer hover:bg-neutral-800 transition-colors border-none"
            >
              <p className="font-sans leading-[24px] text-[17px] text-white uppercase font-normal tracking-[0.5px] whitespace-nowrap m-0 cursor-pointer">
                SEARCH
              </p>
            </button>

            <button
              type="button"
              onClick={handleQuitSearch}
              className="size-[40px] flex items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors rounded-none border border-[#e2e2e2] bg-white p-0 shrink-0"
              aria-label="Close search view"
              title="Close Search"
            >
              <svg fill="none" height="18" viewBox="0 0 20 20" width="18" className="block">
                <path d="M15 5L5 15" stroke="#050505" strokeLinejoin="round" strokeWidth="1.5" />
                <path d="M5 5L15 15" stroke="#050505" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </form>
      </div>



      {/* Category Filter Sub-Bar */}
      <CategoryFilterSubBar
        totalCount={processedProducts.length}
        sortOption="relevance"
        onSortChange={() => {}}
        selectedGender="all"
        onGenderChange={() => {}}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => { setSelectedCategory(cat); setVisibleCount(12); }}
        selectedSize="all"
        onSizeChange={() => {}}
        hideGenderFilter={true}
      />

      {/* Product Results Grid */}
      <div className="relative shrink-0 w-full pb-[100px] flex-1">
        {loading ? (
          <div className="w-full py-[80px] flex justify-center items-center">
            <p className="font-sans text-[17px] text-neutral-400 uppercase tracking-[1px]">Loading recommended products...</p>
          </div>
        ) : processedProducts.length > 0 ? (
          <div className="w-full flex flex-col items-center">
            <div className="product-grid-4col px-[36px] relative w-full">
              {visibleProducts.map((p, idx) => (
                <ProductCard key={p.id ? `${p.id}-${idx}` : `search-prod-${idx}`} product={p} />
              ))}
            </div>

            {/* Load More Button in LOAD MORE (12 OF 14) format */}
            {visibleCount < processedProducts.length && (
              <div className="w-full flex justify-center pt-[48px]">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="bg-[#050505] text-white py-[12px] px-[20px] text-[17px] font-normal uppercase cursor-pointer hover:bg-neutral-800 transition-colors border-none"
                >
                  LOAD MORE ({visibleProducts.length} OF {processedProducts.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full py-[100px] flex flex-col items-center justify-center gap-4 text-center px-[24px]">
            <p
              className="text-[#1c1c1c] uppercase"
              style={{
                fontFamily: "var(--font-display, 'Big Shoulders', sans-serif)",
                fontSize: "24px",
                fontWeight: 500,
                lineHeight: "32px",
              }}
            >
              No products found
            </p>
            <p className="font-sans text-[16px] text-neutral-500 max-w-[400px]">
              We couldn't find any products matching "{activeQuery || selectedCategory}". Try checking for spelling errors or choosing another category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClearInput();
                setSelectedCategory("ALL");
              }}
              className="mt-4 bg-[#050505] text-white py-[12px] px-[20px] text-[17px] font-normal uppercase cursor-pointer hover:bg-neutral-800 transition-colors border-none"
            >
              CLEAR SEARCH & FILTERS
            </button>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}