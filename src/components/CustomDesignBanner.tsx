'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function CustomDesignBanner() {
  return (
    <section className="py-16 bg-white text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
          
          {/* Left Half: Black Box with LIVUS Watermark */}
          <div className="relative bg-slate-950 text-white p-10 sm:p-16 flex flex-col justify-between overflow-hidden min-h-[420px]">
            
            {/* Watermark at bottom */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none text-center overflow-hidden">
              <span className="text-[120px] sm:text-[160px] font-black uppercase tracking-tighter text-slate-900 leading-none">
                LIVUS
              </span>
            </div>

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase leading-tight font-sans">
                Have your own<br />design?
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                Upload your custom kit design or collaborate with our atelier team to create bespoke teamwear built for high performance.
              </p>
            </div>

            <div className="relative z-10 pt-8">
              <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white text-slate-950 hover:bg-slate-200 transition-all shadow-md active:scale-95 cursor-pointer">
                <span>Custom Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Half: Light Grey Box with Custom Jersey Product Image */}
          <div className="bg-slate-100 p-8 flex items-center justify-center relative min-h-[420px]">
            <img
              src="/images/apex_jersey.jpg"
              alt="Custom Apex Athletic Jersey"
              className="max-h-[380px] w-auto object-contain hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
