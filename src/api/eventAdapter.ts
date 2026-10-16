/**
 * event-service Ticket241 → modèles du front.
 * Les réponses de l'API ne sortent jamais de ce fichier sous leur forme brute.
 */
import type { City, Event, TicketType } from '../types';
import { ApiError } from './types';

/* ---------- Réponses de l'API ---------- */

export type ApiTicketCategory = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  price: number;
  availableSeats: number | null;
  displayOrder: number | null;
  isActive: boolean | null;
  maxTicketsPerOrder: number | null;
  benefits: string | null;
  hasAvailableSeats: boolean | null;
};

export type ApiEvent = {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  fullDescription: string | null;
  coverImageUrl: string | null;
  category: string | null;
  categoryDisplayName: string | null;
  startDate: string;
  endDate: string | null;
  doorsOpenTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  cityId: number | null;
  cityName: string | null;
  totalSeats: number | null;
  availableSeats: number | null;
  minPrice: number | null;
  structureId: number | null;
  structureName: string | null;
  organizerName: string | null;
  eventStatus: EventStatus;
  isFeatured: boolean | null;
  isCancelled: boolean | null;
  minAge: number | null;
  allowRefund: boolean | null;
  viewCount: number | null;
  isSaleOpen: boolean | null;
  ticketCategories: ApiTicketCategory[] | null;
};

export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'POSTPONED' | 'SOLD_OUT';

export type ApiCity = { id: number; uuid: string; name: string; country: string | null; countryCode: string | null };

/** Page Spring : seuls ces champs nous servent. */
export type ApiPage<T> = { content: T[]; last: boolean; number: number; totalPages: number };

/* ---------- Conversions ---------- */

/** Visuel affiché quand l'événement n'a pas d'affiche. */
export const FALLBACK_IMAGE = '/images/ticketHome.png';

/**
 * Les dates de l'API sont sans fuseau (heure locale du serveur, au Gabon : UTC+1, sans
 * heure d'été). On fixe le fuseau pour que l'affichage ne dépende pas de l'appareil.
 */
export const serverDate = (s: string) => (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + '+01:00');

/** Ouverture des portes : date complète, ou simple heure (« 19:00:00 ») le jour de l'événement. */
const doorsDate = (doors: string | null, start: string) => {
  if (!doors) return serverDate(start);
  if (/^\d\d:\d\d/.test(doors)) return serverDate(`${start.slice(0, 10)}T${doors.length === 5 ? doors + ':00' : doors}`);
  return serverDate(doors);
};

const ageLabel = (age: number | null) => (age && age > 0 ? `${age} ans` : 'Tout public');

const toTicketType = (c: ApiTicketCategory): TicketType => ({
  id: String(c.id),
  name: c.name,
  price: Number(c.price) || 0,
  note: c.description || c.benefits || '',
  available: c.hasAvailableSeats === false ? 0 : (c.availableSeats ?? undefined),
  maxPerOrder: c.maxTicketsPerOrder ?? undefined,
});

export const toEvent = (e: ApiEvent): Event => {
  const types = (e.ticketCategories ?? [])
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(toTicketType);
  return {
    id: e.uuid,
    numericId: e.id,
    name: e.name,
    category: e.categoryDisplayName || e.category || 'Autre',
    venue: e.venueName ?? '',
    address: e.venueAddress ?? '',
    city: e.cityName ?? '',
    image: e.coverImageUrl || FALLBACK_IMAGE,
    startsAt: serverDate(e.startDate),
    doorsAt: doorsDate(e.doorsOpenTime, e.startDate),
    priceFrom: Number(e.minPrice) || (types.length ? Math.min(...types.map((t) => t.price)) : 0),
    seatsLeft: e.availableSeats ?? 0,
    seatsTotal: e.totalSeats ?? 0,
    minAge: ageLabel(e.minAge),
    organizer: { id: e.structureId != null ? String(e.structureId) : '', name: e.structureName || e.organizerName || '' },
    description: e.fullDescription ?? '',
    ticketTypes: types,
    refundable: !!e.allowRefund,
    saleOpen: !!e.isSaleOpen && !e.isCancelled,
    cancelled: !!e.isCancelled || e.eventStatus === 'CANCELLED',
    featured: !!e.isFeatured,
    views: e.viewCount ?? 0,
  };
};

/** Statuts qu'un visiteur peut consulter ; les autres (brouillon, en validation) sont introuvables. */
const VISIBLE: EventStatus[] = ['PUBLISHED', 'CANCELLED', 'COMPLETED', 'POSTPONED', 'SOLD_OUT'];

/** Détail : la route renvoie l'événement quel que soit son statut, on filtre ici. */
export const toVisibleEvent = (e: ApiEvent): Event => {
  if (!VISIBLE.includes(e.eventStatus)) throw new ApiError(404, undefined, { message: 'Événement introuvable' });
  return toEvent(e);
};

export const toCity = (c: ApiCity): City => ({ id: String(c.id), name: c.name, region: c.country ?? '' });
