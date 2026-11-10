import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  /** Cart line identity (product + colour). Kept for backwards compatibility with saved carts. */
  id: string;
  /** Real product UUID from the database; the server re-prices orders from this. */
  productId?: string;
  slug?: string;
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

export const getCartItemKey = (p: { id: string; color?: string; size?: string }) =>
  `${p.id}-${p.color || ''}-${p.size || ''}`;

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;

  // UI Toggles
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const currentItems = get().items;
        const targetKey = getCartItemKey(product);
        const existingItem = currentItems.find((i) => getCartItemKey(i.product) === targetKey);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              getCartItemKey(i.product) === targetKey
                ? { ...i, product: { ...i.product, ...product }, quantity: Math.min(99, i.quantity + quantity) }
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

      removeItem: (itemKey: string) => {
        set({ items: get().items.filter((i) => getCartItemKey(i.product) !== itemKey) });
      },

      updateQuantity: (itemKey: string, quantity: number) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => getCartItemKey(i.product) !== itemKey) });
          return;
        }
        set({
          items: get().items.map((i) =>
            getCartItemKey(i.product) === itemKey ? { ...i, quantity: Math.min(99, quantity) } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: 'livus-store-cart-v3',
      // Only the cart contents are saved; the drawer should never re-open by itself on page load.
      partialize: (state) => ({ items: state.items }),
    }
  )
);
