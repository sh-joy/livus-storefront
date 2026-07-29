'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function CategorySplitSection({
  onSelectCategory,
}: {
  onSelectCategory: (catId: string | null) => void;
}) {
  return (
    <section className="py-12 bg-white text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 1. For Him Card */}
          <div className="group relative rounded-3xl overflow-hidden bg-slate-100 aspect-[4/5] flex flex-col justify-between p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all">
            {/* Background Image */}
            <img
              src="/images/for_him.jpg"
              alt="For Him Collection"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Sideways Vertical Label */}
            <div className="relative z-10">
              <span className="inline-block text-[10px] font-extrabold tracking-[0.25em] text-slate-950 uppercase rotate-180 origin-left [writing-mode:vertical-lr] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-md">
                PERFORMANCE STREETWEAR
              </span>
            </div>

            {/* Content & Button */}
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-slate-950 drop-shadow-sm font-sans">
                  For<br />Him
                </h2>
              </div>

              <button
                onClick={() => onSelectCategory(null)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white text-slate-950 hover:bg-slate-950 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Shop Him</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. For Her Card */}
          <div className="group relative rounded-3xl overflow-hidden bg-slate-100 aspect-[4/5] flex flex-col justify-between p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all">
            {/* Background Image */}
            <img
              src="/images/for_her.jpg"
              alt="For Her Collection"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />

            {/* Sideways Vertical Label */}
            <div className="relative z-10">
              <span className="inline-block text-[10px] font-extrabold tracking-[0.25em] text-slate-950 uppercase rotate-180 origin-left [writing-mode:vertical-lr] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-md">
                PERFORMANCE STREETWEAR
              </span>
            </div>

            {/* Content & Button */}
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-slate-950 drop-shadow-sm font-sans">
                  For<br />Her
                </h2>
              </div>

              <button
                onClick={() => onSelectCategory(null)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white text-slate-950 hover:bg-slate-950 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Shop Her</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
