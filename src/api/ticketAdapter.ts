/**
 * ticket-service et annuaire des organisateurs → modèles du front.
 * Les réponses de l'API ne sortent jamais de ce fichier sous leur forme brute.
 */
import type { Organizer, Ticket, TicketStatus } from '../types';
import { serverDate } from './eventAdapter';

/* ---------- Réponses de l'API ---------- */

/** Billet complet (détail, commande) : TicketResponseDto. Les listes renvoient un résumé (sans QR ni commande). */
export type ApiTicket = {
  uuid: string;
  ticketNumber: string;
  qrCode?: string | null;
  orderId?: string | null;
  eventId: number;
  eventUuid?: string | null;
  eventName: string;
  eventStartDate: string;
  eventVenueName: string | null;
  eventVenueCityName: string | null;
  ticketCategoryName: string;
  ticketCategoryColor: string | null;
  finalPrice: number | null;
  status: TicketStatus;
  validatedAt?: string | null;
  expirationDate?: string | null;
  paymentStatus?: string | null;
};

/** Réponse de la réservation (avec ou sans compte). */
export type ApiReservation = {
  orderId: string;
  tickets: ApiTicket[];
  ticketCount: number;
  totalAmount: number;
  currency: string;
};

export type ApiGuestReservation = {
  orderId: string;
  accessToken: string;
  reservation: ApiReservation;
};

export type ApiPublicStructure = {
  id: number;
  uuid: string;
  name: string;
  type: string | null;
  city: string | null;
  venue: string | null;
  description: string | null;
  logoUrl: string | null;
  upcomingEventCount: number;
};

/* ---------- Conversions ---------- */

export const toTicket = (t: ApiTicket): Ticket => ({
  ref: t.uuid,
  number: t.ticketNumber,
  qrCode: t.qrCode ?? '',
  orderId: t.orderId ?? '',
  eventId: t.eventUuid ?? '',
  eventNumericId: t.eventId,
  eventName: t.eventName,
  startsAt: serverDate(t.eventStartDate),
  venue: t.eventVenueName ?? '',
  city: t.eventVenueCityName ?? '',
  typeName: t.ticketCategoryName,
  color: t.ticketCategoryColor ?? undefined,
  price: Number(t.finalPrice) || 0,
  status: t.status,
  usedAt: t.validatedAt ? serverDate(t.validatedAt) : undefined,
  expiresAt: t.expirationDate ? serverDate(t.expirationDate) : undefined,
  paymentStatus: t.paymentStatus ?? undefined,
});

export const toOrganizer = (s: ApiPublicStructure): Organizer => ({
  id: String(s.id),
  name: s.name,
  type: s.type?.trim() || 'Autres',
  city: s.city ?? '',
  venue: s.venue ?? '',
  description: s.description ?? '',
  logo: s.logoUrl ?? undefined,
  upcomingCount: s.upcomingEventCount ?? 0,
});
