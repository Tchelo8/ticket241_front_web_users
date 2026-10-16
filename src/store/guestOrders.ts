import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Commandes passées SANS compte sur cet appareil : leur jeton est la seule clé d'accès aux billets
 * (le serveur n'en garde que le hash). On les garde pour que l'invité retrouve ses billets
 * depuis « Mes billets » ; ailleurs, il passe par le lien de la commande ou par un code.
 */
export type GuestOrder = { orderId: string; token: string; eventName: string; createdAt: string };

type GuestOrdersStore = {
  orders: GuestOrder[];
  add: (o: GuestOrder) => void;
  remove: (orderId: string) => void;
};

export const useGuestOrders = create<GuestOrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      add: (o) => set((s) => ({ orders: [o, ...s.orders.filter((x) => x.orderId !== o.orderId)].slice(0, 50) })),
      remove: (orderId) => set((s) => ({ orders: s.orders.filter((x) => x.orderId !== orderId) })),
    }),
    { name: 't241.guestOrders', storage: createJSONStorage(() => localStorage) },
  ),
);

/** Lien d'une commande sans compte : le jeton est après « # », il n'est donc jamais envoyé aux serveurs. */
export const guestOrderLink = (orderId: string, token: string) =>
  `${window.location.origin}/commande/${encodeURIComponent(orderId)}#${token}`;
