'use client';

import React, { Suspense } from 'react';
import { SiteNav } from '@/figma-components/SiteNav';
import { SiteFooter } from '@/figma-components/SiteFooter';
import ProductDetails from '@/imports/ProductDetails';
import ProductDetails1 from '@/imports/ProductDetails-1';
import Search from '@/imports/Search';
import Search1 from '@/imports/Search-1';
import Profile from '@/imports/Profile';
import Profile1 from '@/imports/Profile-1';
import { ProfilePage } from '@/figma-components/ProfilePage';
import Checkout from '@/imports/Checkout';
import Checkout1 from '@/imports/Checkout-1';
import SizingGuide from '@/imports/SizingGuide';
import SizingGuide1 from '@/imports/SizingGuide-1';
import DesignWithBigShoulders from '@/imports/DesignWithBigShoulders';
import DesignWithBigShoulders1 from '@/imports/DesignWithBigShoulders-1';

function DesignVariantsContent() {
  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans pb-20">
      {/* Sticky Table of Contents Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-white tracking-widest">LIVUS — ALL COMPONENT & PAGE VARIANTS</h1>
        <div className="flex gap-4 text-xs uppercase tracking-wider overflow-x-auto py-1">
          <a href="#footers" className="hover:text-amber-400">Footers</a>
          <a href="#headers" className="hover:text-amber-400">Headers</a>
          <a href="#profile" className="hover:text-amber-400">Profile Variants</a>
          <a href="#product" className="hover:text-amber-400">Product Details</a>
          <a href="#checkout" className="hover:text-amber-400">Checkout</a>
          <a href="#search" className="hover:text-amber-400">Search</a>
          <a href="#sizing" className="hover:text-amber-400">Sizing Guides</a>
          <a href="#kit-banners" className="hover:text-amber-400">Kit Banners</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-20">

        {/* ── FOOTERS SECTION ── */}
        <section id="footers" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Footers</h2>
            <p className="text-neutral-400 text-sm">All available footer component variants.</p>
          </div>

          <div className="flex flex-col gap-10">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Footer Variant 1 (SiteFooter — Primary)</span>
              <SiteFooter />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Footer Variant 2 (Figma Export)</span>
              <SiteFooter variant="dark" />
            </div>
          </div>
        </section>

        {/* ── HEADERS SECTION ── */}
        <section id="headers" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Headers & Navigation</h2>
            <p className="text-neutral-400 text-sm">Site navigation and header variants.</p>
          </div>

          <div className="bg-white text-black p-4 rounded-xl border border-neutral-700">
            <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Site Header (SiteNav — Primary)</span>
            <SiteNav />
          </div>
        </section>

        {/* ── PROFILE VARIANTS SECTION ── */}
        <section id="profile" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Profile Page Variants</h2>
            <p className="text-neutral-400 text-sm">All 3 Profile page layout variants.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Profile Variant 1 (Interactive Form + Order History)</span>
              <ProfilePage />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Profile Variant 2 (Figma Export #1)</span>
              <Profile />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Profile Variant 3 (Figma Export #2)</span>
              <Profile1 />
            </div>
          </div>
        </section>

        {/* ── PRODUCT DETAILS SECTION ── */}
        <section id="product" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Product Details Variants</h2>
            <p className="text-neutral-400 text-sm">Product showcase page layout variants.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Product Details Variant 1</span>
              <ProductDetails />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Product Details Variant 2</span>
              <ProductDetails1 />
            </div>
          </div>
        </section>

        {/* ── CHECKOUT SECTION ── */}
        <section id="checkout" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Checkout Variants</h2>
            <p className="text-neutral-400 text-sm">Checkout and order summary variants.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Checkout Variant 1</span>
              <Checkout />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Checkout Variant 2</span>
              <Checkout1 />
            </div>
          </div>
        </section>

        {/* ── SEARCH SECTION ── */}
        <section id="search" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Search Page Variants</h2>
            <p className="text-neutral-400 text-sm">Interactive search view variants.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Search Variant 1</span>
              <Search />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Search Variant 2</span>
              <Search1 />
            </div>
          </div>
        </section>

        {/* ── SIZING GUIDES SECTION ── */}
        <section id="sizing" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Sizing Guide Variants</h2>
            <p className="text-neutral-400 text-sm">Interactive sizing table variants.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Sizing Guide Variant 1</span>
              <SizingGuide />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Sizing Guide Variant 2</span>
              <SizingGuide1 />
            </div>
          </div>
        </section>

        {/* ── KIT BANNERS SECTION ── */}
        <section id="kit-banners" className="flex flex-col gap-6">
          <div className="border-b border-amber-500/40 pb-3">
            <h2 className="font-serif text-3xl font-bold text-amber-400 uppercase tracking-wider">Custom Kit Banners</h2>
            <p className="text-neutral-400 text-sm">Banner sections for custom team kit printing.</p>
          </div>

          <div className="flex flex-col gap-12">
            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Kit Banner Variant 1</span>
              <DesignWithBigShoulders />
            </div>

            <div className="bg-white text-black p-4 rounded-xl border border-neutral-700 overflow-hidden">
              <span className="bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider inline-block mb-4">Kit Banner Variant 2</span>
              <DesignWithBigShoulders1 />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default function DesignVariantsPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-neutral-900" />}>
      <DesignVariantsContent />
    </Suspense>
  );
}
