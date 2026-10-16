import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Theme } from '../types';

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'ink' : 'paper';

/**
 * Préférences de cet appareil : thème, ville par défaut et favoris (gardés dans le navigateur ;
 * pas encore de favoris côté serveur). Les alertes e-mail, elles, sont enregistrées par l'API.
 */
type Prefs = {
  theme: Theme;
  city: string;
  favIds: string[];
  setTheme: (t: Theme) => void;
  setCity: (c: string) => void;
  toggleFav: (id: string) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      city: 'Libreville',
      favIds: [],
      setTheme: (theme) => set({ theme }),
      setCity: (city) => set({ city }),
      toggleFav: (id) =>
        set((s) => ({ favIds: s.favIds.includes(id) ? s.favIds.filter((x) => x !== id) : [...s.favIds, id] })),
    }),
    {
      name: 't241.prefs',
      storage: createJSONStorage(() => localStorage),
      // v0 : favoris de démonstration pré-remplis et alertes locales → on garde thème et ville seulement
      version: 1,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<Prefs>;
        return { theme: p.theme ?? systemTheme(), city: p.city ?? 'Libreville', favIds: [] as string[] } as unknown as Prefs;
      },
    },
  ),
);
