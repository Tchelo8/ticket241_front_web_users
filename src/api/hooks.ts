/** Hooks TanStack Query : toutes les lectures passent par `apiService`. */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
import { usePrefs } from '../store/prefs';
import type { Event } from '../types';
import { apiService, type OrderAccess } from './apiService';

export const useEvents = () => useQuery({ queryKey: ['events'], queryFn: () => apiService.events.list(), staleTime: 60_000 });

/** Détail d'un événement : chaque appel compte une vue côté serveur, on le garde 5 min. */
export const useEvent = (id: string | undefined) =>
  useQuery({ queryKey: ['event', id], queryFn: () => apiService.events.get(id!), enabled: !!id, staleTime: 5 * 60_000 });

export const useCities = () =>
  useQuery({ queryKey: ['cities'], queryFn: () => apiService.cities.list(), staleTime: 10 * 60_000 });

export const useOrganizers = () =>
  useQuery({ queryKey: ['organizers'], queryFn: () => apiService.organizers.list(), staleTime: 60_000 });

/** Billets du compte connecté (aucun appel sans session). */
export const useTickets = () => {
  const token = useAuth((s) => s.token);
  return useQuery({ queryKey: ['tickets', token], queryFn: () => apiService.tickets.list(), enabled: !!token });
};

export const useTicket = (ref: string | undefined) =>
  useQuery({ queryKey: ['ticket', ref], queryFn: () => apiService.tickets.get(ref!), enabled: !!ref });

/** Billets d'une commande (avec compte ou avec le jeton invité), relus toutes les 3 s si `poll`. */
export const useOrder = (order: OrderAccess | undefined, poll = false) =>
  useQuery({
    queryKey: ['order', order?.orderId, !!order?.guestToken],
    queryFn: () => apiService.orders.get(order!),
    enabled: !!order?.orderId,
    refetchInterval: poll ? 3000 : false,
    refetchIntervalInBackground: true,
  });

/**
 * Favoris : sur le compte (event-service) si une session est ouverte, sinon dans ce navigateur.
 * Le cœur change tout de suite ; avec un compte, la liste est relue si le serveur refuse.
 */
export const useFavorites = () => {
  const token = useAuth((s) => s.token);
  const localIds = usePrefs((s) => s.favIds);
  const toggleLocal = usePrefs((s) => s.toggleFav);
  const qc = useQueryClient();
  const key = ['favorites', token];
  const { data: accountEvents, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => apiService.favorites.list(),
    enabled: !!token,
  });
  const ids = token ? (accountEvents ?? []).map((e) => e.id) : localIds;

  const toggle = async (id: string) => {
    if (!token) return toggleLocal(id);
    const wasFav = ids.includes(id);
    // Pour l'affichage immédiat, l'événement ajouté est repris des listes déjà chargées
    const known = qc.getQueryData<Event>(['event', id]) ?? qc.getQueryData<Event[]>(['events'])?.find((e) => e.id === id);
    qc.setQueryData<Event[]>(key, (list = []) =>
      wasFav ? list.filter((e) => e.id !== id) : known ? [known, ...list] : list,
    );
    try {
      await (wasFav ? apiService.favorites.remove(id) : apiService.favorites.add(id));
      if (!wasFav && !known) await qc.invalidateQueries({ queryKey: key });
    } catch {
      await qc.invalidateQueries({ queryKey: key });
    }
  };

  return { ids, isFav: (id: string) => ids.includes(id), toggle, accountEvents: token ? accountEvents : undefined, isLoading: !!token && isLoading };
};

/** À la connexion : les favoris gardés dans le navigateur sont versés sur le compte, puis oubliés ici. */
export const useFavoritesSync = () => {
  const token = useAuth((s) => s.token);
  const qc = useQueryClient();
  useEffect(() => {
    if (!token) return;
    const ids = usePrefs.getState().favIds;
    if (ids.length === 0) return;
    apiService.favorites
      .import(ids)
      .then((events) => {
        qc.setQueryData(['favorites', token], events);
        usePrefs.getState().clearFavs();
      })
      // Échec réseau : les favoris restent dans le navigateur, nouvel essai au prochain chargement
      .catch(() => {});
  }, [token, qc]);
};
