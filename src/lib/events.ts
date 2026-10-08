import type { Event } from '../types';
import { referenceNow } from './clock';

export const isPast = (e: Event) => new Date(e.startsAt).getTime() < referenceNow().getTime();

/** Nombre de billets vendus, pour le tri par popularité. */
export const sold = (e: Event) => e.seatsTotal - e.seatsLeft;

export const ticketPrice = (e: Event, k: 'std' | 'vip') => e.ticketTypes.find((t) => t.id === k)?.price ?? 0;

export const subtotal = (e: Event, q: { std: number; vip: number }) =>
  ticketPrice(e, 'std') * q.std + ticketPrice(e, 'vip') * q.vip;

/** Réduction de démonstration LBV10 : −10 %. */
export const DISCOUNT = { code: 'LBV10', rate: 0.1 };
export const discount = (sub: number) => Math.round(sub * DISCOUNT.rate);
export const SERVICE_FEE = 0;
