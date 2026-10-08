import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Cart = { eventId: string; std: number; vip: number };

type CartStore = {
  cart: Cart | null;
  setCart: (c: Cart) => void;
  bump: (k: 'std' | 'vip', d: number) => void;
  removeLine: (k: 'std' | 'vip') => void;
  clear: () => void;
};

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      bump: (k, d) => set((s) => (s.cart ? { cart: { ...s.cart, [k]: Math.max(0, s.cart[k] + d) } } : s)),
      removeLine: (k) => set((s) => (s.cart ? { cart: { ...s.cart, [k]: 0 } } : s)),
      clear: () => set({ cart: null }),
    }),
    { name: 't241.cart', storage: createJSONStorage(() => sessionStorage) },
  ),
);

export const cartCount = (c: Cart | null) => (c ? c.std + c.vip : 0);
