'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Heart,
  Globe,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  activeCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
}

export function Navbar({
  cartCount,
  wishlistCount = 2,
  onOpenCart,
  onOpenAdmin,
  activeCategory,
  onSelectCategory,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState('USD ($)');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)', 'CAD ($)', 'AUD ($)'];

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-800 text-[11px] font-medium py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center space-x-6 text-slate-400">
            <span className="flex items-center hover:text-white transition-colors cursor-pointer">
              <Globe className="w-3 h-3 mr-1.5 text-indigo-400" /> Worldwide Express Shipping
            </span>
            <span>Free Returns Within 30 Days</span>
          </div>

          <div className="w-full md:w-auto text-center font-semibold text-slate-200 tracking-wide">
            COMPLIMENTARY SHIPPING ON ORDERS OVER $150 &nbsp;—&nbsp; USE CODE <span className="text-amber-400 font-bold">LIVUS15</span>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Currency Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center text-slate-300 hover:text-white transition-colors py-0.5"
              >
                <span>{currency}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {isCurrencyOpen && (
                <div className="absolute right-0 mt-1 w-28 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCurrency(c);
                        setIsCurrencyOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center text-[11px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Database & Schema
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl py-3.5'
            : 'bg-slate-950 border-b border-slate-900 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Left: Mobile Menu Toggle & Desktop Navigation Links */}
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold tracking-wider text-slate-300 uppercase">
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`hover:text-white transition-colors py-1 relative ${
                    activeCategory === null ? 'text-white font-bold' : ''
                  }`}
                >
                  Shop
                  {activeCategory === null && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  )}
                </button>

                <a href="#catalog-section" className="hover:text-white transition-colors py-1">
                  Collections
                </a>

                <a href="#catalog-section" className="hover:text-white transition-colors py-1">
                  New Arrivals
                </a>

                <button
                  onClick={onOpenAdmin}
                  className="hover:text-indigo-400 transition-colors py-1 text-slate-400"
                >
                  Architecture Specs
                </button>
              </nav>
            </div>

            {/* Center: LIVUS Brand Logo */}
            <div className="text-center cursor-pointer" onClick={() => onSelectCategory(null)}>
              <span className="text-2xl sm:text-3xl font-black tracking-[0.3em] uppercase text-white hover:opacity-90 transition-opacity">
                LIVUS
              </span>
              <span className="block text-[9px] font-semibold tracking-[0.25em] text-indigo-400 uppercase">
                Studio & Atelier
              </span>
            </div>

            {/* Right: Actions (Search, Wishlist, Account, Shopping Bag) */}
            <div className="flex items-center space-x-5">
              
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account Button */}
              <button
                onClick={onOpenAdmin}
                className="hidden sm:flex items-center p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
                title="Account"
              >
                <User className="w-5 h-5" />
              </button>

              {/* Wishlist Button */}
              <button
                className="relative p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={onOpenCart}
                className="relative inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Bag</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-white text-indigo-950 rounded-full">
                  {cartCount}
                </span>
              </button>

            </div>

          </div>
        </div>

        {/* Search Bar Slide-Down Overlay */}
        {isSearchOpen && (
          <div className="border-t border-slate-800 bg-slate-900/95 py-4 px-4 shadow-xl transition-all">
            <div className="max-w-3xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search LIVUS collections, products, or materials..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-sm font-semibold tracking-wider text-slate-300 uppercase">
              <button
                onClick={() => {
                  onSelectCategory(null);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-2 border-b border-slate-900 text-white font-bold"
              >
                Shop All Products
              </button>
              <a
                href="#catalog-section"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 border-b border-slate-900"
              >
                Collections
              </a>
              <a
                href="#catalog-section"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 border-b border-slate-900"
              >
                New Arrivals
              </a>
              <button
                onClick={() => {
                  onOpenAdmin();
                  setIsMobileMenuOpen(false);
                }}
                className="text-left py-2 text-indigo-400"
              >
                Database Specs & Schema
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
