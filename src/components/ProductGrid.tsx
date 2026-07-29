'use client';

import React, { useState } from 'react';
import { ProductItem } from '@/app/actions/products';
import { CategoryItem } from '@/app/actions/categories';
import { ShoppingCart, Check, ChevronDown } from 'lucide-react';

interface ProductGridProps {
  products: ProductItem[];
  categories: CategoryItem[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onAddToCart: (product: ProductItem) => void;
}

export function ProductGrid({
  products,
  categories,
  activeCategory,
  onSelectCategory,
  onAddToCart,
}: ProductGridProps) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [sortOption, setSortOption] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  const filteredProducts = products.filter((product) => {
    return !activeCategory || product.categoryId === activeCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price-low') return parseFloat(a.price) - parseFloat(b.price);
    if (sortOption === 'price-high') return parseFloat(b.price) - parseFloat(a.price);
    return 0;
  });

  const handleAdd = (product: ProductItem) => {
    onAddToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  return (
    <section id="catalog-section" className="py-16 bg-white text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title & Description */}
        <div className="mb-10 space-y-2">
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 font-sans">
            Explore the collection
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
            Discover the latest athletic streetwear from custom kit designs, engineered for athletic performance.
          </p>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-10 border-b border-slate-200">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-6 overflow-x-auto pb-2 sm:pb-0 text-xs font-bold uppercase tracking-wider text-slate-500">
            <button
              onClick={() => onSelectCategory(null)}
              className={`hover:text-slate-950 transition-colors pb-1 relative ${
                activeCategory === null ? 'text-slate-950 font-black' : ''
              }`}
            >
              All Products
              {activeCategory === null && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-950 rounded-full" />
              )}
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`hover:text-slate-950 transition-colors pb-1 relative whitespace-nowrap ${
                  activeCategory === cat.id ? 'text-slate-950 font-black' : ''
                }`}
              >
                {cat.name}
                {activeCategory === cat.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-950 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span>Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent font-bold text-slate-950 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest ↓</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

        </div>

        {/* Product Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedProducts.map((product, idx) => (
            <div
              key={product.id}
              className="group flex flex-col justify-between space-y-4"
            >
              {/* Image Box */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center p-4 border border-slate-200/80">
                <img
                  src={
                    product.imageUrl ||
                    (idx % 3 === 0
                      ? '/images/for_him.jpg'
                      : idx % 3 === 1
                      ? '/images/for_her.jpg'
                      : '/images/apex_jersey.jpg')
                  }
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-xl"
                />

                {/* Badge top left */}
                {idx % 2 === 0 ? (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-extrabold uppercase bg-slate-950 text-white tracking-widest">
                    NEW
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-extrabold uppercase bg-amber-500 text-slate-950 tracking-widest">
                    SALE
                  </span>
                )}
              </div>

              {/* Title, Price, & Action */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-950 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Performance Streetwear</p>
                  </div>
                  <span className="text-sm font-extrabold text-slate-950">
                    ${parseFloat(product.price).toFixed(2)} USD
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(product)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                    addedIds[product.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 hover:bg-slate-800 text-white active:scale-98'
                  }`}
                >
                  {addedIds[product.id] ? (
                    <span className="flex items-center justify-center space-x-1">
                      <Check className="w-3.5 h-3.5" /> <span>Added to Bag</span>
                    </span>
                  ) : (
                    <span>Add to Bag</span>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
