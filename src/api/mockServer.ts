/**
 * Faux serveur de démonstration : même contrat que l'API réelle (`ApiService`),
 * données tirées de `src/mocks/` et état gardé dans le navigateur.
 *
 * Règles de démonstration :
 * - connexion : tout numéro d'au moins 8 chiffres et tout mot de passe ;
 * - paiement : confirmé environ 5 s après la demande ;
 * - code SMS : « 0000 » est refusé (5e échec : trop de tentatives), tout autre code réussit ;
 *   un code expire au bout de 10 minutes ; un renvoi remet les essais à zéro.
 */
import { EVENTS } from '../mocks/events';
import { ORGANIZERS, SEED_FOLLOWED } from '../mocks/organizers';
import { SEED_TICKETS } from '../mocks/tickets';
import type { Ticket, User } from '../types';
import { OtpError, type ApiService, type PaymentRequest, type SignupDraft } from './types';

/** Réglages du faux serveur (modifiables dans les tests). */
export const mockConfig = {
  /** Multiplie toutes les latences simulées : 0 dans les tests. */
  latencyFactor: 1,
  /** Fait échouer le prochain « Suivre / Ne plus suivre ». */
  failNextFollow: false,
};

export const DEMO_USER: User = { firstName: 'Alida', lastName: 'Nzé Mba', phone: '074 12 34 56', email: 'alida.nze@example.ga' };
export const MOCK_INVALID_CODE = '0000';
export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms * mockConfig.latencyFactor));

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

/* ---------- Billets ---------- */

const TICKETS_KEY = 't241.mock.tickets';
const storedTickets = () => read<Ticket[]>(localStorage, TICKETS_KEY, SEED_TICKETS);

/* ---------- Paiements ---------- */

type MockTx = PaymentRequest & { createdAt: number; expiresAt: number; ticketRef?: string; cancelled?: boolean };
const TX_KEY = 't241.mock.tx';
const CONFIRM_AFTER_MS = 5200;
const PAYMENT_TTL_S = 87;
const readTx = () => read<Record<string, MockTx>>(sessionStorage, TX_KEY, {});

const randomRef = () => `TK241-${Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}-LBV`;

/* ---------- Inscription ---------- */

type PendingSignup = { draft: Omit<SignupDraft, 'password'>; sentAt: number; failures: number };
const pendingSignups = new Map<string, PendingSignup>();
const phoneKey = (phone: string) => phone.replace(/\D/g, '');

/* ---------- Abonnements ---------- */

const FOLLOW_KEY = 't241.mock.following';
const readFollowed = () => read<string[]>(localStorage, FOLLOW_KEY, SEED_FOLLOWED);
const setFollow = async (id: string, on: boolean) => {
  await wait(150);
  if (mockConfig.failNextFollow) {
    mockConfig.failNextFollow = false;
    throw new Error('Échec simulé');
  }
  const ids = readFollowed().filter((x) => x !== id);
  write(localStorage, FOLLOW_KEY, on ? [...ids, id] : ids);
};

export const mockApi: ApiService = {
  events: {
    async list() {
      await wait(120);
      return EVENTS;
    },
    async get(id) {
      await wait(80);
      const ev = EVENTS.find((e) => e.id === id);
      if (!ev) throw new Error('Événement introuvable');
      return ev;
    },
  },

  tickets: {
    async list() {
      await wait(120);
      return storedTickets();
    },
    async get(ref) {
      await wait(60);
      const t = storedTickets().find((x) => x.ref === ref);
      if (!t) throw new Error('Billet introuvable');
      return t;
    },
  },

  payments: {
    async create(req) {
      await wait(1400);
      const txId = 'tx_' + Date.now().toString(36);
      const now = Date.now();
      const tx: MockTx = { ...req, createdAt: now, expiresAt: now + PAYMENT_TTL_S * 1000 };
      write(sessionStorage, TX_KEY, { ...readTx(), [txId]: tx });
      return { txId, expiresAt: new Date(tx.expiresAt).toISOString() };
    },
    async status(txId) {
      const all = readTx();
      const tx = all[txId];
      if (!tx || tx.cancelled) return { status: 'failed' };
      if (tx.ticketRef) return { status: 'success', ticketRef: tx.ticketRef };
      const now = Date.now();
      if (now - tx.createdAt >= CONFIRM_AFTER_MS) {
        const ref = randomRef();
        const typeName = [tx.std > 0 && 'Standard', tx.vip > 0 && 'Carré VIP'].filter(Boolean).join(' + ');
        const ticket: Ticket = { ref, eventId: tx.eventId, typeName, quantity: tx.std + tx.vip, paid: tx.amount, method: tx.method };
        write(localStorage, TICKETS_KEY, [ticket, ...storedTickets()]);
        all[txId] = { ...tx, ticketRef: ref };
        write(sessionStorage, TX_KEY, all);
        return { status: 'success', ticketRef: ref };
      }
      if (now > tx.expiresAt) return { status: 'expired' };
      return { status: 'pending' };
    },
    async resend(txId) {
      await wait(500);
      const all = readTx();
      const tx = all[txId];
      if (!tx) throw new Error('Transaction inconnue');
      const now = Date.now();
      all[txId] = { ...tx, createdAt: now, expiresAt: now + PAYMENT_TTL_S * 1000 };
      write(sessionStorage, TX_KEY, all);
      return { txId, expiresAt: new Date(all[txId].expiresAt).toISOString() };
    },
    async cancel(txId) {
      const all = readTx();
      if (all[txId]) all[txId].cancelled = true;
      write(sessionStorage, TX_KEY, all);
    },
  },

  auth: {
    async login(phone, password) {
      await wait(500);
      if (phoneKey(phone).length < 8 || password.length < 1) throw new Error('Numéro ou mot de passe incorrect.');
      return { ...DEMO_USER, phone };
    },
    async logout() {},
  },

  signup: {
    async start(draft) {
      await wait(500);
      const { password: _password, ...rest } = draft;
      void _password;
      pendingSignups.set(phoneKey(draft.phone), { draft: rest, sentAt: Date.now(), failures: 0 });
    },
    async verify(phone, code) {
      await wait(500);
      const p = pendingSignups.get(phoneKey(phone));
      if (!p) throw new OtpError('expired');
      if (p.failures >= MAX_OTP_ATTEMPTS) throw new OtpError('too_many');
      if (Date.now() - p.sentAt > OTP_TTL_MS) throw new OtpError('expired');
      if (code === MOCK_INVALID_CODE) {
        p.failures += 1;
        throw new OtpError(p.failures >= MAX_OTP_ATTEMPTS ? 'too_many' : 'invalid');
      }
      pendingSignups.delete(phoneKey(phone));
      return p.draft;
    },
    async resend(phone) {
      await wait(500);
      const p = pendingSignups.get(phoneKey(phone));
      if (p) {
        p.sentAt = Date.now();
        p.failures = 0;
      }
    },
  },

  organizers: {
    async list() {
      await wait(150);
      return ORGANIZERS;
    },
    async following() {
      await wait(150);
      return readFollowed();
    },
    follow: (id) => setFollow(id, true),
    unfollow: (id) => setFollow(id, false),
  },
};

/** Remet le faux serveur à zéro (tests). */
export const resetMockServer = () => {
  pendingSignups.clear();
  mockConfig.latencyFactor = 1;
  mockConfig.failNextFollow = false;
};
