import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SignupDraft } from '../api/types';

type Fields = Omit<SignupDraft, 'password'>;

type SignupStore = {
  /** Champs saisis, conservés (sessionStorage) pour le retour au formulaire. */
  fields: Fields;
  /** Mot de passe gardé en mémoire seulement, jamais écrit dans le stockage. */
  password: string;
  /** Une inscription attend la vérification du code. */
  pending: boolean;
  retour: string;
  setFields: (f: Partial<Fields>) => void;
  setPassword: (p: string) => void;
  begin: (retour: string) => void;
  finish: () => void;
};

const EMPTY: Fields = { firstName: '', lastName: '', email: '', phone: '' };

export const useSignup = create<SignupStore>()(
  persist(
    (set) => ({
      fields: EMPTY,
      password: '',
      pending: false,
      retour: '/',
      setFields: (f) => set((s) => ({ fields: { ...s.fields, ...f } })),
      setPassword: (password) => set({ password }),
      begin: (retour) => set({ pending: true, retour }),
      finish: () => set({ fields: EMPTY, password: '', pending: false, retour: '/' }),
    }),
    {
      name: 't241.signup',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ fields, pending, retour }) => ({ fields, pending, retour }),
    },
  ),
);
