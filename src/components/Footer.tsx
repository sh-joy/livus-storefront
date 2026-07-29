'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Share2,
  AtSign,
  Send,
  CreditCard,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Newsletter Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 sm:p-12 border border-slate-800/80 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
              The LIVUS Circle
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Subscribe for Exclusive Releases & Private Atelier Sales
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Join our global member network to receive early access to seasonal collections, limited drops, and open-source architecture updates.
            </p>

            {subscribed ? (
              <div className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thank you for joining LIVUS. Welcome to the circle.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-bold text-xs text-slate-950 bg-white hover:bg-slate-100 transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none rounded-r-3xl" />
        </div>

        {/* 4-Column Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Column 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="text-2xl font-black tracking-[0.3em] uppercase text-white">
                LIVUS
              </span>
              <span className="block text-[9px] font-semibold tracking-[0.25em] text-indigo-400 uppercase mt-0.5">
                Studio & Atelier
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              LIVUS is a modern luxury studio combining minimalist aesthetics with enterprise-grade open-source technology. Self-hostable on standard PostgreSQL infrastructure.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="#"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                title="Global Network"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                title="Social Community"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
                title="Direct Inquiries"
              >
                <AtSign className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 3: Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Shop Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#catalog-section" className="hover:text-white transition-colors">New Arrivals</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Best Sellers</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Electronics & Audio</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Apparel & Wearables</a></li>
              <li><a href="#catalog-section" className="hover:text-white transition-colors">Home & Workspace</a></li>
            </ul>
          </div>

          {/* Column 4: Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Customer Care</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Track Order Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Size Guide & Fit</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Column 5: Atelier & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-white uppercase">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Next.js 15 App Router</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Drizzle ORM Engine</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Neon PostgreSQL Host</a></li>
              <li><a href="#" className="hover:text-white transition-colors">S3 Storage Standard</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Zero Vendor Lock-In</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Legal & Payment Provider Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center space-x-2">
            <span>© 2026 LIVUS Studio Inc. All rights reserved.</span>
            <span className="text-slate-800">•</span>
            <span className="flex items-center text-slate-400">
              <Lock className="w-3 h-3 mr-1 text-emerald-400" /> SSL Encrypted
            </span>
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Cookie Settings</a>
          </div>

        </div>

      </div>
    </footer>
  );
}
