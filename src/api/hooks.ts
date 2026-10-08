import { useQuery } from '@tanstack/react-query';
import { fetchEvent, fetchEvents, fetchPaymentStatus, fetchTicket, fetchTickets } from './client';

export const useEvents = () => useQuery({ queryKey: ['events'], queryFn: fetchEvents, staleTime: 60_000 });

export const useEvent = (id: string | undefined) =>
  useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id!), enabled: !!id, staleTime: 60_000 });

export const useTickets = () => useQuery({ queryKey: ['tickets'], queryFn: fetchTickets });

export const useTicket = (ref: string | undefined) =>
  useQuery({ queryKey: ['ticket', ref], queryFn: () => fetchTicket(ref!), enabled: !!ref });

/** Statut du paiement interrogé toutes les 3 s tant qu'il est en attente. */
export const usePaymentStatus = (txId: string | undefined) =>
  useQuery({
    queryKey: ['payment', txId],
    queryFn: () => fetchPaymentStatus(txId!),
    enabled: !!txId,
    refetchInterval: (q) => (q.state.data && q.state.data.status !== 'pending' ? false : 3000),
    refetchIntervalInBackground: true,
    gcTime: 0,
  });
