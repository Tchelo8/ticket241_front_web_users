import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Panier d'un événement : quantité par catégorie de billet (id → nombre). */
export type Cart = { eventId: string; lines: Record<string, number> };

type CartStore = {
  cart: Cart | null;
  setCart: (c: Cart) => void;
  bump: (typeId: string, d: number) => void;
  removeLine: (typeId: string) => void;
  clear: () => void;
};

const setLine = (c: Cart, typeId: string, qty: number): Cart => ({ ...c, lines: { ...c.lines, [typeId]: Math.max(0, qty) } });

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      cart: null,
      setCart: (cart) => set({ cart }),
      bump: (k, d) => set((s) => (s.cart ? { cart: setLine(s.cart, k, (s.cart.lines[k] ?? 0) + d) } : s)),
      removeLine: (k) => set((s) => (s.cart ? { cart: setLine(s.cart, k, 0) } : s)),
      clear: () => set({ cart: null }),
    }),
    {
      name: 't241.cart',
      storage: createJSONStorage(() => sessionStorage),
      // v0 : { std, vip } — ancien format, on repart d'un panier vide.
      version: 1,
      migrate: () => ({ cart: null }),
    },
  ),
);

export const cartCount = (c: Cart | null) => (c ? Object.values(c.lines).reduce((n, q) => n + q, 0) : 0);
