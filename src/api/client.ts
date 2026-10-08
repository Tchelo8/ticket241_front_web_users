/**
 * Accès aux données. En mode démonstration (par défaut), tout est servi par les
 * fixtures de `mocks/`. Avec VITE_USE_MOCKS=false, les mêmes fonctions appellent
 * l'API REST (VITE_API_URL) ; la session repose alors sur un cookie httpOnly.
 */
import { USE_MOCKS } from '../lib/clock';
import { EVENTS } from '../mocks/events';
import { SEED_TICKETS } from '../mocks/tickets';
import type { Event, PaymentMethod, PaymentStatus, Ticket, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const read = <T>(storage: Storage, key: string, fallback: T): T => {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (storage: Storage, key: string, value: unknown) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on reste en mémoire */
  }
};

/* ---------- Événements ---------- */

export const fetchEvents = async (): Promise<Event[]> => {
  if (!USE_MOCKS) return http('/events');
  await wait(120);
  return EVENTS;
};

export const fetchEvent = async (id: string): Promise<Event> => {
  if (!USE_MOCKS) return http(`/events/${encodeURIComponent(id)}`);
  await wait(80);
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) throw new Error('Événement introuvable');
  return ev;
};

/* ---------- Billets ---------- */

const TICKETS_KEY = 't241.mock.tickets';
const mockTickets = () => read<Ticket[]>(localStorage, TICKETS_KEY, SEED_TICKETS);

export const fetchTickets = async (): Promise<Ticket[]> => {
  if (!USE_MOCKS) return http('/me/tickets');
  await wait(120);
  return mockTickets();
};

export const fetchTicket = async (ref: string): Promise<Ticket> => {
  if (!USE_MOCKS) return http(`/me/tickets/${encodeURIComponent(ref)}`);
  await wait(60);
  const t = mockTickets().find((x) => x.ref === ref);
  if (!t) throw new Error('Billet introuvable');
  return t;
};

/* ---------- Paiement ---------- */

export type PaymentRequest = {
  eventId: string;
  std: number;
  vip: number;
  method: PaymentMethod;
  name: string;
  phone: string;
  amount: number;
};

export type PaymentIntent = { txId: string; expiresAt: string };
export type PaymentState = { status: PaymentStatus; ticketRef?: string };

type MockTx = PaymentRequest & { createdAt: number; expiresAt: number; ticketRef?: string; cancelled?: boolean };
const TX_KEY = 't241.mock.tx';
const MOCK_CONFIRM_AFTER_MS = 5200;
const PAYMENT_TTL_S = 87;

const randomRef = () => {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `TK241-${hex}-LBV`;
};

export const createPayment = async (req: PaymentRequest): Promise<PaymentIntent> => {
  if (!USE_MOCKS) return http('/payments', { method: 'POST', body: JSON.stringify(req) });
  await wait(1400);
  const txId = 'tx_' + Date.now().toString(36);
  const now = Date.now();
  const tx: MockTx = { ...req, createdAt: now, expiresAt: now + PAYMENT_TTL_S * 1000 };
  write(sessionStorage, TX_KEY, { ...read(sessionStorage, TX_KEY, {}), [txId]: tx });
  return { txId, expiresAt: new Date(tx.expiresAt).toISOString() };
};

export const resendPayment = async (txId: string): Promise<PaymentIntent> => {
  if (!USE_MOCKS) return http(`/payments/${txId}/resend`, { method: 'POST' });
  await wait(500);
  const all = read<Record<string, MockTx>>(sessionStorage, TX_KEY, {});
  const tx = all[txId];
  if (!tx) throw new Error('Transaction inconnue');
  const now = Date.now();
  all[txId] = { ...tx, createdAt: now, expiresAt: now + PAYMENT_TTL_S * 1000 };
  write(sessionStorage, TX_KEY, all);
  return { txId, expiresAt: new Date(all[txId].expiresAt).toISOString() };
};

export const cancelPayment = async (txId: string): Promise<void> => {
  if (!USE_MOCKS) {
    await http(`/payments/${txId}/cancel`, { method: 'POST' });
    return;
  }
  const all = read<Record<string, MockTx>>(sessionStorage, TX_KEY, {});
  if (all[txId]) all[txId].cancelled = true;
  write(sessionStorage, TX_KEY, all);
};

export const fetchPaymentStatus = async (txId: string): Promise<PaymentState> => {
  if (!USE_MOCKS) return http(`/payments/${txId}`);
  const all = read<Record<string, MockTx>>(sessionStorage, TX_KEY, {});
  const tx = all[txId];
  if (!tx || tx.cancelled) return { status: 'failed' };
  if (tx.ticketRef) return { status: 'success', ticketRef: tx.ticketRef };
  const now = Date.now();
  if (now - tx.createdAt >= MOCK_CONFIRM_AFTER_MS) {
    const ref = randomRef();
    const types = [tx.std > 0 && 'Standard', tx.vip > 0 && 'Carré VIP'].filter(Boolean).join(' + ');
    const ticket: Ticket = {
      ref, eventId: tx.eventId, typeName: types, quantity: tx.std + tx.vip, paid: tx.amount, method: tx.method,
    };
    write(localStorage, TICKETS_KEY, [ticket, ...mockTickets()]);
    all[txId] = { ...tx, ticketRef: ref };
    write(sessionStorage, TX_KEY, all);
    return { status: 'success', ticketRef: ref };
  }
  if (now > tx.expiresAt) return { status: 'expired' };
  return { status: 'pending' };
};

/* ---------- Authentification ---------- */

export const DEMO_USER: User = { firstName: 'Alida', lastName: 'Nzé Mba', phone: '074 12 34 56', email: 'alida.nze@example.ga' };

export const login = async (phone: string, password: string): Promise<User> => {
  if (!USE_MOCKS) return http('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
  await wait(500);
  if (phone.replace(/\D/g, '').length < 8 || password.length < 1) {
    throw new Error('Numéro ou mot de passe incorrect.');
  }
  return { ...DEMO_USER, phone };
};

export const signup = async (u: User & { password: string }): Promise<User> => {
  if (!USE_MOCKS) return http('/auth/signup', { method: 'POST', body: JSON.stringify(u) });
  await wait(600);
  const { password: _password, ...user } = u;
  void _password;
  return user;
};

export const logout = async () => {
  if (!USE_MOCKS) await http('/auth/logout', { method: 'POST' });
};
