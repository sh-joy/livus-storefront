'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { getCategoriesAction } from '@/app/actions/products';

export interface CategoryFilterSubBarProps {
  totalCount: number;
  sortOption: string;
  onSortChange: (sort: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSize: string;
  onSizeChange: (size: string) => void;
  hideGenderFilter?: boolean;
  categoriesList?: Array<{ id: string; name: string; slug: string }>;
  availableTags?: string[];
}

export function CategoryFilterSubBar({
  totalCount,
  sortOption,
  onSortChange,
  selectedGender,
  onGenderChange,
  selectedCategory,
  onCategoryChange,
  selectedSize,
  onSizeChange,
  hideGenderFilter = false,
  categoriesList,
  availableTags = [],
}: CategoryFilterSubBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'gender' | 'category' | 'size' | null>(null);
  const [dbCategories, setDbCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamically fetch categories from Postgres backend
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await getCategoriesAction();
        setDbCategories(cats);
      } catch (err) {
        console.warn('Failed to load DB categories in sub-bar:', err);
      }
    }
    if (!categoriesList || categoriesList.length === 0) {
      loadCats();
    }
  }, [categoriesList]);

  const activeCategories = categoriesList && categoriesList.length > 0 ? categoriesList : dbCategories;

  const sortOptions = [
    { label: 'RELEVANCE', value: 'relevance' },
    { label: 'NEWEST', value: 'newest' },
    { label: 'BEST SELLING', value: 'best-selling' },
    { label: 'POPULAR', value: 'popular' },
    { label: 'PRICE: LOW TO HIGH', value: 'low-to-high' },
    { label: 'PRICE: HIGH TO LOW', value: 'high-to-low' },
  ];

  const genderOptions = [
    { label: 'ALL GENDERS', value: 'all' },
    { label: 'FOR HIM', value: 'for-him' },
    { label: 'FOR HER', value: 'for-her' },
    { label: 'UNISEX', value: 'unisex' },
  ];

  // Dynamic Category Options combining Backend Categories & Collection Tags
  const categoryOptions = useMemo(() => {
    const list: Array<{ label: string; value: string }> = [{ label: 'ALL CATEGORIES', value: 'all' }];

    // 1. Add Categories from Postgres Database
    activeCategories.forEach((c) => {
      if (c.name && !list.some((item) => item.value.toLowerCase() === c.slug.toLowerCase())) {
        list.push({ label: c.name.toUpperCase(), value: c.slug.toLowerCase() });
      }
    });

    // 2. Add Collection Tags from Products
    if (availableTags && availableTags.length > 0) {
      availableTags.forEach((tag) => {
        if (tag && !list.some((item) => item.value.toLowerCase() === tag.toLowerCase())) {
          list.push({ label: tag.toUpperCase(), value: tag.toLowerCase() });
        }
      });
    }

    // 3. Fallback default collection tags if list is small
    const defaults = ['MINIMAL', 'CASUAL', 'DIVINE', 'FORMAL', 'FLORAL'];
    defaults.forEach((tag) => {
      if (!list.some((item) => item.value.toLowerCase() === tag.toLowerCase())) {
        list.push({ label: tag, value: tag.toLowerCase() });
      }
    });

    return list;
  }, [activeCategories, availableTags]);

  const sizeOptions = [
    { label: 'ALL SIZES', value: 'all' },
    { label: 'XS', value: 'XS' },
    { label: 'S', value: 'S' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' },
    { label: 'XL', value: 'XL' },
    { label: 'XXL', value: 'XXL' },
  ];

  const getSortButtonText = (val: string) => {
    if (!val || val === '' || val === 'none') return 'SORT';
    const found = sortOptions.find((o) => o.value === val);
    return found ? `SORT : ${found.label}` : 'SORT';
  };

  const getGenderLabel = (val: string) => {
    const found = genderOptions.find((o) => o.value === val);
    return found ? found.label : 'GENDER';
  };

  const getCategoryLabel = (val: string) => {
    if (!val || val === 'all') return 'CATEGORY';
    const found = categoryOptions.find((o) => o.value.toLowerCase() === val.toLowerCase() || o.label.toLowerCase() === val.toLowerCase());
    return found ? found.label : val.toUpperCase();
  };

  const getSizeLabel = (val: string) => {
    const found = sizeOptions.find((o) => o.value === val);
    return found ? found.label : 'SIZE';
  };

  return (
    <div ref={barRef} className="w-full relative z-30 bg-white py-4 px-[36px] font-sans select-none max-w-[2560px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* 1. SORT DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="px-[20px] py-[12px] border border-neutral-200 bg-white text-black text-[17px] font-normal uppercase tracking-wider flex items-center justify-between gap-3 hover:border-black min-w-[180px] rounded-none cursor-pointer transition-colors"
            >
              <span>{getSortButtonText(sortOption)}</span>
              <ChevronDown className={`size-4 text-neutral-600 transition-transform duration-200 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-neutral-200 p-0 z-50 flex flex-col shadow-xl min-w-[220px] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                {sortOptions.map((opt) => {
                  const isSelected = sortOption === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-wider border-b border-neutral-100 last:border-b-0 rounded-none transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 text-black font-medium'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-black'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. GENDER DROPDOWN */}
          {!hideGenderFilter && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'gender' ? null : 'gender')}
                className="px-[20px] py-[12px] border border-neutral-200 bg-white text-black text-[17px] font-normal uppercase tracking-wider flex items-center justify-between gap-3 hover:border-black min-w-[140px] rounded-none cursor-pointer transition-colors"
              >
                <span>{selectedGender === 'all' ? 'GENDER' : getGenderLabel(selectedGender)}</span>
                <ChevronDown className={`size-4 text-neutral-600 transition-transform duration-200 ${openDropdown === 'gender' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'gender' && (
                <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-neutral-200 p-0 z-50 flex flex-col shadow-xl min-w-[180px] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  {genderOptions.map((opt) => {
                    const isSelected = selectedGender === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onGenderChange(opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-wider border-b border-neutral-100 last:border-b-0 rounded-none transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-100 text-black font-medium'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-black'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. SIZE DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'size' ? null : 'size')}
              className="px-[20px] py-[12px] border border-neutral-200 bg-white text-black text-[17px] font-normal uppercase tracking-wider flex items-center justify-between gap-3 hover:border-black min-w-[120px] rounded-none cursor-pointer transition-colors"
            >
              <span>{selectedSize === 'all' ? 'SIZE' : `SIZE: ${selectedSize}`}</span>
              <ChevronDown className={`size-4 text-neutral-600 transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'size' && (
              <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-neutral-200 p-0 z-50 flex flex-col shadow-xl min-w-[140px] animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                {sizeOptions.map((opt) => {
                  const isSelected = selectedSize === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSizeChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-wider border-b border-neutral-100 last:border-b-0 rounded-none transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 text-black font-medium'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-black'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. CATEGORY DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              className="px-[20px] py-[12px] border border-neutral-200 bg-white text-black text-[17px] font-normal uppercase tracking-wider flex items-center justify-between gap-3 hover:border-black min-w-[160px] rounded-none cursor-pointer transition-colors"
            >
              <span>{selectedCategory === 'all' ? 'CATEGORY' : getCategoryLabel(selectedCategory)}</span>
              <ChevronDown className={`size-4 text-neutral-600 transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdown === 'category' && (
              <div className="absolute top-[calc(100%+4px)] left-0 bg-white border border-neutral-200 p-0 z-50 flex flex-col shadow-xl min-w-[220px] max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 border-b border-neutral-100">
                {categoryOptions.map((opt) => {
                  const isSelected = selectedCategory.toLowerCase() === opt.value.toLowerCase();
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onCategoryChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-[20px] py-[12px] text-[17px] font-normal uppercase tracking-wider border-b border-neutral-100 last:border-b-0 rounded-none transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 text-black font-medium'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-black'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Product Count Display (100% Identical to Search Page styling) */}
        <p className="font-sans text-[15px] uppercase tracking-[0.8px] text-neutral-500 font-medium m-0">
          {totalCount} PRODUCTS
        </p>
      </div>
    </div>
  );
}
