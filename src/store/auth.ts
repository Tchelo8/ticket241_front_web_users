import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '../types';

/**
 * Session utilisateur : profil affiché + JWT renvoyé par l'auth-service (valable 24 h,
 * sans refresh token). Le JWT part dans `Authorization: Bearer …` (voir apiService).
 */
type AuthStore = {
  user: User | null;
  token: string | null;
  signIn: (u: User, token?: string | null) => void;
  update: (u: Partial<User>) => void;
  signOut: () => void;
};

/** Champs du JWT (lus sans vérification : seul le serveur fait foi). */
const tokenClaims = (token: string): Record<string, unknown> | null => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/** Identifiant numérique du compte (champ `uid` du JWT), utilisé par notification-service. */
export const accountIdOf = (token: string | null): number | null => {
  const uid = token ? tokenClaims(token)?.uid : null;
  return typeof uid === 'number' ? uid : typeof uid === 'string' && /^\d+$/.test(uid) ? Number(uid) : null;
};

/** Date d'expiration (ms) lue dans le champ `exp` du JWT, ou null si illisible. */
export const tokenExpiry = (token: string): number | null => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(part)) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

const expired = (token: string | null) => {
  if (!token) return false;
  const exp = tokenExpiry(token);
  return exp === null || exp <= Date.now();
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      signIn: (user, token = null) => set({ user, token }),
      update: (u) => set((s) => (s.user ? { user: { ...s.user, ...u } } : s)),
      signOut: () => set({ user: null, token: null }),
    }),
    {
      name: 't241.session',
      storage: createJSONStorage(() => localStorage),
      // Session expirée pendant l'absence : on repart déconnecté.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthStore>;
        return expired(p.token ?? null) ? current : { ...current, ...p };
      },
    },
  ),
);

/**
 * Déconnecte à l'expiration du JWT (onglet resté ouvert).
 * Renvoie la fonction de nettoyage à appeler au démontage.
 */
export const watchSessionExpiry = () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = (token: string | null) => {
    clearTimeout(timer);
    if (!token) return;
    const exp = tokenExpiry(token);
    // setTimeout plafonne à ~24,8 jours ; le JWT dure 24 h.
    const delay = exp === null ? 0 : Math.min(exp - Date.now(), 2 ** 31 - 1);
    timer = setTimeout(() => useAuth.getState().signOut(), Math.max(0, delay));
  };
  arm(useAuth.getState().token);
  const unsub = useAuth.subscribe((s, prev) => {
    if (s.token !== prev.token) arm(s.token);
  });
  return () => {
    clearTimeout(timer);
    unsub();
  };
};

export const fullName = (u: User | null) => (u ? `${u.firstName} ${u.lastName}`.trim() : '');
