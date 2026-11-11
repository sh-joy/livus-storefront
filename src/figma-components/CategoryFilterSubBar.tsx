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
  hideProductCount?: boolean;
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
  hideProductCount = false,
  categoriesList,
  availableTags = [],
}: CategoryFilterSubBarProps) {
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'gender' | 'category' | 'size' | null>(null);
  const [dbCategories, setDbCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left?: number; right?: number; minWidth: number } | null>(null);

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

  // The menu sits in a fixed layer, so close it when the page scrolls or resizes.
  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [openDropdown]);

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
    return found ? `Sort: ${found.label}` : 'Sort';
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

  type Key = 'sort' | 'gender' | 'category' | 'size';
  const filters: Array<{ key: Key; label: string; active: boolean; options: Array<{ label: string; value: string }>; value: string; onChange: (v: string) => void }> = [
    ...(!hideGenderFilter
      ? [{ key: 'gender' as Key, label: selectedGender === 'all' ? 'Gender' : getGenderLabel(selectedGender), active: selectedGender !== 'all', options: genderOptions, value: selectedGender, onChange: onGenderChange }]
      : []),
    { key: 'category', label: selectedCategory === 'all' ? 'Category' : getCategoryLabel(selectedCategory), active: selectedCategory !== 'all', options: categoryOptions, value: selectedCategory, onChange: onCategoryChange },
    { key: 'size', label: selectedSize === 'all' ? 'Size' : `Size: ${selectedSize}`, active: selectedSize !== 'all', options: sizeOptions, value: selectedSize, onChange: onSizeChange },
    { key: 'sort', label: getSortButtonText(sortOption), active: Boolean(sortOption && sortOption !== 'relevance' && sortOption !== 'none'), options: sortOptions, value: sortOption, onChange: onSortChange },
  ];

  const openFilter = filters.find((f) => f.key === openDropdown) || null;

  const toggle = (key: Key, el: HTMLElement) => {
    if (openDropdown === key) {
      setOpenDropdown(null);
      return;
    }
    // The chip row can scroll sideways, which would clip a menu inside it, so the menu is placed
    // in a fixed layer right under the tapped chip and kept on screen.
    const r = el.getBoundingClientRect();
    // Chips on the right half open their menu aligned to the chip's right edge, others to its left edge.
    const vw = window.innerWidth;
    setMenuPos(
      r.left + r.width / 2 > vw / 2
        ? { top: r.bottom + 4, right: Math.max(16, vw - r.right), minWidth: r.width }
        : { top: r.bottom + 4, left: Math.max(16, r.left), minWidth: r.width }
    );
    setOpenDropdown(key);
  };

  return (
    <div ref={barRef} className="w-full relative z-30 bg-white font-sans select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-[var(--lv-gutter)]">
        <div
          className="flex flex-nowrap gap-2 overflow-x-auto px-[var(--lv-gutter)] sm:px-0 sm:flex-wrap sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={() => setOpenDropdown(null)}
        >
          {filters.map((f) => {
            const open = openDropdown === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={(e) => toggle(f.key, e.currentTarget)}
                className={`shrink-0 h-11 px-4 flex items-center gap-2 border bg-white text-[14px] uppercase tracking-[0.08em] whitespace-nowrap cursor-pointer transition-colors ${
                  f.active ? 'border-[#0d0d0d] text-[#0d0d0d]' : 'border-[#e2e2e2] text-[#1a1a1a] hover:border-[#0d0d0d]'
                }`}
              >
                <span>{f.label}</span>
                <ChevronDown className={`size-4 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>
        {!hideProductCount && (
          <p className="t-small m-0 px-[var(--lv-gutter)] sm:px-0 uppercase tracking-[0.08em] text-neutral-500 whitespace-nowrap">
            {totalCount} {totalCount === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      {openFilter && menuPos && (
        <div
          role="listbox"
          className="fixed z-[60] flex flex-col bg-white border border-[#e2e2e2] shadow-xl w-max max-w-[calc(100vw-32px)] max-h-[320px] overflow-y-auto"
          style={{ top: menuPos.top, left: menuPos.left, right: menuPos.right, minWidth: menuPos.minWidth }}
        >
          {openFilter.options.map((opt) => {
            const isSelected = openFilter.value.toLowerCase() === opt.value.toLowerCase();
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  openFilter.onChange(opt.value);
                  setOpenDropdown(null);
                }}
                className={`w-full text-left h-11 px-4 text-[14px] uppercase tracking-[0.08em] whitespace-nowrap border-b border-neutral-100 last:border-b-0 cursor-pointer transition-colors ${
                  isSelected ? 'bg-neutral-100 text-black' : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-black'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
