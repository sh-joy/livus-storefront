'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export function HeroSection({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="relative bg-white text-slate-950 overflow-hidden pt-8 pb-16">
      
      {/* Top Header Grid inside Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          
          {/* Left Headline */}
          <div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-slate-950 font-serif">
              Your game.<br />
              <span className="font-sans font-black">Your Design.</span>
            </h1>
          </div>

          {/* Right Subtitle & CTA */}
          <div className="max-w-md space-y-4 lg:text-right">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              New seasonal drops and custom designs built for performance. Shop the latest look.
            </p>
            <div className="lg:justify-end flex">
              <button
                onClick={onExplore}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-950 hover:bg-slate-800 text-white transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Hero Image Container with Giant Watermark */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Giant Watermark Text */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none overflow-hidden">
          <span className="text-[120px] sm:text-[220px] lg:text-[320px] font-black uppercase tracking-tighter text-slate-200/60 leading-none">
            LIVUS
          </span>
        </div>

        {/* Hero Image */}
        <div className="relative z-10 mx-auto max-w-3xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
          <img
            src="/images/hero_models.jpg"
            alt="LIVUS Streetwear Models"
            className="w-full h-full object-cover object-center hover:scale-102 transition-transform duration-700"
          />
          {/* Soft Bottom Gradient Fade */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none" />
        </div>

      </div>

    </section>
  );
}
