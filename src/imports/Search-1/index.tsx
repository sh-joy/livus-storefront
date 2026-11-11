'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition, useMemo } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { SiteFooter } from '@/figma-components/SiteFooter';
import { SiteNav } from '@/figma-components/SiteNav';
import { ProductCard } from '@/figma-components/ProductCard';
import { CategoryFilterSubBar } from '@/figma-components/CategoryFilterSubBar';
import { getProducts } from '@/app/actions/products';

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
  const colors = (p.colors || (p.colorName ? [p.colorName] : [])).map((c: string) => c.toLowerCase());

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [sortOption, setSortOption] = useState("relevance");
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
        const prods = await getProducts();
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

      if (selectedSize !== 'all' && p.sizes && p.sizes.length > 0) {
        if (!p.sizes.map((sz: string) => sz.toUpperCase()).includes(selectedSize.toUpperCase())) return false;
      }

      if (!q) return true;
      const matchScore = calculateQueryMatchScore(p, q);
      return matchScore > 0;
    });

    const time = (p: any) => (p.createdAt ? new Date(p.createdAt).getTime() : 0);
    const discount = (p: any) => (p.compareAtPriceBdt && p.compareAtPriceBdt > p.priceBdt ? (p.compareAtPriceBdt - p.priceBdt) / p.compareAtPriceBdt : 0);
    result.sort((a, b) => {
      if (sortOption === 'low-to-high') return a.priceBdt - b.priceBdt;
      if (sortOption === 'high-to-low') return b.priceBdt - a.priceBdt;
      if (sortOption === 'newest') return time(b) - time(a);
      if (sortOption === 'best-selling') return discount(b) - discount(a);
      if (sortOption === 'popular') return calculateRecommendationScore(b) - calculateRecommendationScore(a);
      if (q) {
        return calculateQueryMatchScore(b, q) - calculateQueryMatchScore(a, q);
      } else {
        return calculateRecommendationScore(b) - calculateRecommendationScore(a);
      }
    });

    return result;
  }, [allProducts, activeQuery, selectedCategory, selectedSize, sortOption]);

  const visibleProducts = processedProducts.slice(0, visibleCount);

  return (
    <div className="bg-white content-stretch flex flex-col items-center pt-0 relative size-full min-h-screen" data-name="Search">
      <SiteNav />

      {/* Search Input Bar */}
      <div className="w-full px-[var(--lv-gutter)] pt-[clamp(24px,3.5vw,48px)] pb-[clamp(20px,2.5vw,32px)]">
        <form onSubmit={handleSearchSubmit} role="search" className="mx-auto w-full max-w-[760px] flex items-stretch gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-3 h-11 px-4 border border-[#d9d9d9] bg-white focus-within:border-[#0d0d0d] transition-colors">
            {query ? (
              <button
                type="button"
                onClick={handleClearInput}
                className="size-6 -ml-1 flex items-center justify-center shrink-0 bg-transparent border-none p-0 cursor-pointer hover:opacity-70"
                aria-label="Clear search text"
              >
                <X className="size-[18px] stroke-[1.5]" aria-hidden />
              </button>
            ) : (
              <SearchIcon className="size-[18px] stroke-[1.5] shrink-0 opacity-50" aria-hidden />
            )}
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              id="site-search"
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder="Search products"
              className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-[16px] text-[#1c1c1c] placeholder:text-[#8a8a8a] [&::-webkit-search-cancel-button]:hidden"
              style={{ fontFamily: "'Overused Grotesk', sans-serif" }}
            />
          </div>
          <button type="submit" className="lv-btn lv-btn--solid !px-5 sm:!px-7">
            Search
          </button>
          <button
            type="button"
            onClick={handleQuitSearch}
            className="hidden sm:flex size-11 items-center justify-center shrink-0 border border-[#d9d9d9] bg-white cursor-pointer hover:border-[#0d0d0d]"
            aria-label="Close search"
          >
            <X className="size-[18px] stroke-[1.5]" aria-hidden />
          </button>
        </form>
      </div>



      {/* Category Filter Sub-Bar */}
      <CategoryFilterSubBar
        totalCount={processedProducts.length}
        sortOption={sortOption}
        onSortChange={(v) => { setSortOption(v); setVisibleCount(12); }}
        selectedGender="all"
        onGenderChange={() => {}}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => { setSelectedCategory(cat); setVisibleCount(12); }}
        selectedSize={selectedSize}
        onSizeChange={(v) => { setSelectedSize(v); setVisibleCount(12); }}
        hideGenderFilter={true}
      />

      {/* Product Results Grid */}
      <div className="h-6 md:h-8" aria-hidden />
      <div className="relative shrink-0 w-full flex-1">
        {loading ? (
          <div className="w-full py-12 flex justify-center items-center">
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
              <div className="w-full flex justify-center pt-[clamp(28px,3.5vw,40px)]">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="lv-btn lv-btn--outline"
                >
                  LOAD MORE ({visibleProducts.length} OF {processedProducts.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full py-14 flex flex-col items-center justify-center gap-4 text-center px-[24px]">
            <p
              className="text-[#1c1c1c] uppercase"
              style={{
                fontFamily: "'Overused Grotesk', sans-serif",
                fontSize: "24px",
                fontWeight: 500,
                lineHeight: "32px",
              }}
            >
              No products found
            </p>
            <p className="font-sans text-[16px] text-neutral-500 max-w-[400px]">
              We couldn't find any products matching "{activeQuery || (selectedCategory === "all" ? "your filters" : selectedCategory)}". Try checking for spelling errors or choosing another category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClearInput();
                setSelectedCategory("all");
                setSelectedSize("all");
              }}
              className="lv-btn lv-btn--solid mt-4"
            >
              CLEAR SEARCH & FILTERS
            </button>
          </div>
        )}
      </div>

      <SiteFooter compact />
    </div>
  );
}