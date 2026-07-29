'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { CategorySplitSection } from '@/components/CategorySplitSection';
import { ProductGrid } from '@/components/ProductGrid';
import { CustomDesignBanner } from '@/components/CustomDesignBanner';
import { CartDrawer, CartItem } from '@/components/CartDrawer';
import { AdminModal } from '@/components/AdminModal';
import { Footer } from '@/components/Footer';
import { getProducts, ProductItem } from '@/app/actions/products';
import { CategoryItem } from '@/app/actions/categories';

interface StorefrontClientProps {
  initialProducts: ProductItem[];
  initialCategories: CategoryItem[];
}

export function StorefrontClient({ initialProducts, initialCategories }: StorefrontClientProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [categories] = useState<CategoryItem[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleSelectCategory = async (catId: string | null) => {
    setActiveCategory(catId);
    setIsFiltering(true);
    try {
      const filtered = await getProducts(catId || undefined);
      setProducts(filtered);
    } catch (err) {
      console.warn('Failed to filter products from server action:', err);
      if (catId) {
        setProducts(initialProducts.filter((p) => p.categoryId === catId));
      } else {
        setProducts(initialProducts);
      }
    } finally {
      setIsFiltering(false);
    }
  };

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-slate-950 flex flex-col font-sans selection:bg-slate-950 selection:text-white">
      
      {/* 1. Header (Navbar) */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 2. Hero Section */}
      <HeroSection
        onExplore={() => {
          document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Category Split Banner ("For Him" & "For Her") */}
      <CategorySplitSection onSelectCategory={handleSelectCategory} />

      {/* 4. Product Catalog ("Explore the collection") */}
      <main className="flex-1">
        {isFiltering ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-600">Loading LIVUS products from Neon database...</p>
          </div>
        ) : (
          <ProductGrid
            products={products}
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      {/* 5. Custom Design Banner ("Have your own design?") */}
      <CustomDesignBanner />

      {/* 6. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* 7. Admin / Architecture Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        categories={categories}
      />

      {/* 8. Footer */}
      <Footer />

    </div>
  );
}
