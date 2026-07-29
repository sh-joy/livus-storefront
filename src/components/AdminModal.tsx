'use client';

import React, { useState } from 'react';
import { createProductAction } from '@/app/actions/products';
import { createCategoryAction, CategoryItem } from '@/app/actions/categories';
import { Database, Plus, Layers, ShieldCheck, Server, X, Check, Code2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
}

export function AdminModal({ isOpen, onClose, categories }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<'architecture' | 'new-product' | 'new-category'>('architecture');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);

    const res = await createProductAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage('Product created successfully using Drizzle ORM!');
      (e.target as HTMLFormElement).reset();
    } else {
      setStatusMessage(res.message || 'Validation error. Please check form inputs.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);

    const res = await createCategoryAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage('Category created successfully!');
      (e.target as HTMLFormElement).reset();
    } else {
      setStatusMessage(res.message || 'Validation error. Check slug format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl text-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Database & Architecture Panel</h2>
              <p className="text-xs text-slate-400">Open-Source PostgreSQL + Drizzle ORM Setup</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => { setActiveTab('architecture'); setStatusMessage(null); }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Stack Specs & Rules
          </button>
          <button
            onClick={() => { setActiveTab('new-product'); setStatusMessage(null); }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'new-product'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Add New Product
          </button>
          <button
            onClick={() => { setActiveTab('new-category'); setStatusMessage(null); }}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'new-category'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Add New Category
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center">
              <Check className="w-4 h-4 mr-2 text-indigo-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-semibold text-indigo-400">Database Layer</span>
                  <h4 className="font-bold text-sm text-white">PostgreSQL (Standard pg)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses standard Node-Postgres connection pool. Zero vendor lock-in. Connects seamlessly to Neon, AWS RDS, or Docker.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-semibold text-purple-400">ORM & Query Builder</span>
                  <h4 className="font-bold text-sm text-white">Drizzle ORM</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    100% type-safe SQL queries with zero runtime overhead. Schemas defined in <code className="text-indigo-300 font-mono text-[11px]">src/db/schema.ts</code>.
                  </p>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                  <span className="flex items-center"><Code2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> src/db/index.ts</span>
                  <span className="text-emerald-400 font-sans font-bold">Standard Connection Pool</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
{`import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'new-product' && (
            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Product Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Ultra Noise Cancelling Headphones"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Slug</label>
                  <input
                    name="slug"
                    required
                    placeholder="e.g. ultra-noise-cancelling-headphones"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price ($)</label>
                  <input
                    name="price"
                    required
                    placeholder="199.99"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stock</label>
                  <input
                    name="stock"
                    type="number"
                    defaultValue={15}
                    required
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    name="categoryId"
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
                <input
                  name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Detailed product features & description..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" name="isFeatured" id="isFeatured" className="rounded bg-slate-950 border-slate-800" />
                <label htmlFor="isFeatured" className="font-semibold text-slate-300">Feature on store landing page</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all text-xs"
              >
                {isSubmitting ? 'Inserting via Drizzle...' : 'Insert Product via Server Action'}
              </button>
            </form>
          )}

          {activeTab === 'new-category' && (
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Smart Wearables"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Slug</label>
                <input
                  name="slug"
                  required
                  placeholder="e.g. smart-wearables"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Category overview..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all text-xs"
              >
                {isSubmitting ? 'Creating Category...' : 'Create Category'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
