/** Hooks TanStack Query : toutes les lectures passent par `apiService`. */
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store/auth';
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
