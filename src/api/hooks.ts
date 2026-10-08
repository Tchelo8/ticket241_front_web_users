/** Hooks TanStack Query : toutes les lectures passent par `apiService`. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { apiService } from './apiService';

export const useEvents = () => useQuery({ queryKey: ['events'], queryFn: () => apiService.events.list(), staleTime: 60_000 });

export const useEvent = (id: string | undefined) =>
  useQuery({ queryKey: ['event', id], queryFn: () => apiService.events.get(id!), enabled: !!id, staleTime: 60_000 });

export const useTickets = () => useQuery({ queryKey: ['tickets'], queryFn: () => apiService.tickets.list() });

export const useTicket = (ref: string | undefined) =>
  useQuery({ queryKey: ['ticket', ref], queryFn: () => apiService.tickets.get(ref!), enabled: !!ref });

/** Statut du paiement interrogé toutes les 3 s tant qu'il est en attente. */
export const usePaymentStatus = (txId: string | undefined) =>
  useQuery({
    queryKey: ['payment', txId],
    queryFn: () => apiService.payments.status(txId!),
    enabled: !!txId,
    refetchInterval: (q) => (q.state.data && q.state.data.status !== 'pending' ? false : 3000),
    refetchIntervalInBackground: true,
    gcTime: 0,
  });

export const useOrganizers = () =>
  useQuery({ queryKey: ['organizers'], queryFn: () => apiService.organizers.list(), staleTime: 60_000 });

/** Organisateurs suivis ; un invité n'en suit aucun. */
export const useFollowing = () => {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: ['following', !!user],
    queryFn: () => apiService.organizers.following(),
    enabled: !!user,
    placeholderData: [],
  });
};

/** Suivre / ne plus suivre, avec mise à jour optimiste. Invité → connexion. */
export function useToggleFollow() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const key = ['following', true];

  const mutation = useMutation({
    mutationFn: ({ id, follow }: { id: string; follow: boolean }) =>
      follow ? apiService.organizers.follow(id) : apiService.organizers.unfollow(id),
    onMutate: async ({ id, follow }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key) ?? [];
      qc.setQueryData<string[]>(key, follow ? [...previous.filter((x) => x !== id), id] : previous.filter((x) => x !== id));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (id: string, currentlyFollowing: boolean) => {
    if (!user) {
      navigate(`/connexion?retour=${encodeURIComponent(pathname + search)}`);
      return;
    }
    mutation.mutate({ id, follow: !currentlyFollowing });
  };
}
