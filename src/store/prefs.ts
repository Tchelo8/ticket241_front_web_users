import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Theme } from '../types';

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper';

type Prefs = {
  theme: Theme;
  city: string;
  /** Favoris de l'invité (l'API prend le relais une fois connecté). */
  favIds: string[];
  alerts: { onSale: boolean; reminder: boolean; newsletter: boolean };
  setTheme: (t: Theme) => void;
  setCity: (c: string) => void;
  toggleFav: (id: string) => void;
  setAlert: (k: keyof Prefs['alerts'], on: boolean) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      city: 'Libreville',
      favIds: ['jazz', 'ogooue'],
      alerts: { onSale: true, reminder: true, newsletter: false },
      setTheme: (theme) => set({ theme }),
      setCity: (city) => set({ city }),
      toggleFav: (id) =>
        set((s) => ({ favIds: s.favIds.includes(id) ? s.favIds.filter((x) => x !== id) : [...s.favIds, id] })),
      setAlert: (k, on) => set((s) => ({ alerts: { ...s.alerts, [k]: on } })),
    }),
    { name: 't241.prefs', storage: createJSONStorage(() => localStorage) },
  ),
);
