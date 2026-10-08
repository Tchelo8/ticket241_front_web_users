import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '../types';

/**
 * En production, la session vit dans un cookie httpOnly posé par l'API ; ce store
 * ne garde que le profil affiché. En démonstration, il est mémorisé localement.
 */
type AuthStore = {
  user: User | null;
  signIn: (u: User) => void;
  update: (u: Partial<User>) => void;
  signOut: () => void;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      update: (u) => set((s) => (s.user ? { user: { ...s.user, ...u } } : s)),
      signOut: () => set({ user: null }),
    }),
    { name: 't241.session', storage: createJSONStorage(() => localStorage) },
  ),
);

export const fullName = (u: User | null) => (u ? `${u.firstName} ${u.lastName}`.trim() : '');
