import type { Event } from '../types';
import { referenceNow } from './clock';

export const isPast = (e: Event) => new Date(e.startsAt).getTime() < referenceNow().getTime();

/** Nombre de billets vendus, pour le tri par popularité. */
export const sold = (e: Event) => e.seatsTotal - e.seatsLeft;

export const ticketPrice = (e: Event, typeId: string) => e.ticketTypes.find((t) => t.id === typeId)?.price ?? 0;

export const subtotal = (e: Event, lines: Record<string, number>) =>
  Object.entries(lines).reduce((sum, [typeId, qty]) => sum + ticketPrice(e, typeId) * qty, 0);

/** Moins de 20 % des places restantes. */
export const almostFull = (e: Event) => e.seatsTotal > 0 && e.seatsLeft > 0 && e.seatsLeft / e.seatsTotal < 0.2;

/** Pourquoi la billetterie est fermée (null si elle est ouverte). */
export const saleClosedReason = (e: Event): string | null => {
  if (e.saleOpen) return null;
  if (e.cancelled) return 'Événement annulé';
  if (isPast(e)) return 'Événement passé';
  if (e.seatsTotal > 0 && e.seatsLeft <= 0) return 'Complet';
  return 'Billetterie fermée';
};

/** Composition de l'accueil, déduite du catalogue. */
export const homeLayout = (events: Event[]) => {
  const upcoming = events
    .filter((e) => !isPast(e) && !e.cancelled)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const spotlight = [...upcoming.filter((e) => e.featured), ...upcoming.filter((e) => !e.featured)];
  return {
    featured: spotlight[0] as Event | undefined,
    side: spotlight.slice(1, 3),
    trending: [...upcoming].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 4),
    upcoming,
  };
};
