import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  color?: string;
  size?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // UI Toggles
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Empty by default as requested by user
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        // Key by product id + color + size combination
        const itemKey = `${product.id}-${product.color || ''}-${product.size || ''}`;
        const existingItem = currentItems.find(
          (i) => `${i.product.id}-${i.product.color || ''}-${i.product.size || ''}` === itemKey
        );

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              `${i.product.id}-${i.product.color || ''}-${i.product.size || ''}` === itemKey
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [...currentItems, { product, quantity }],
            isOpen: true,
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: 'livus-store-cart-v2',
    }
  )
);
