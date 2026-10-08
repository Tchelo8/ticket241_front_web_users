/** Types et erreurs partagés par l'API réelle (apiService) et le faux serveur (mockServer). */
import type { Organizer } from '../mocks/organizers';
import type { Event, PaymentMethod, PaymentStatus, Ticket, User } from '../types';

/* ---------- Erreurs ---------- */

/** Réponse HTTP en erreur : statut, code métier éventuel ({ error: '…' }) et corps brut. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

export type OtpErrorCode = 'invalid' | 'expired' | 'too_many';

/** Erreur métier renvoyée par la vérification du code SMS. */
export class OtpError extends Error {
  constructor(public readonly code: OtpErrorCode) {
    super(code);
    this.name = 'OtpError';
  }
}

/* ---------- Charges utiles ---------- */

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

export type SignupDraft = User & { password: string };

/* ---------- Contrat du service ---------- */

/** Toutes les opérations disponibles côté serveur, regroupées par domaine. */
export interface ApiService {
  events: {
    list(): Promise<Event[]>;
    get(id: string): Promise<Event>;
  };
  tickets: {
    list(): Promise<Ticket[]>;
    get(ref: string): Promise<Ticket>;
  };
  payments: {
    create(req: PaymentRequest): Promise<PaymentIntent>;
    status(txId: string): Promise<PaymentState>;
    resend(txId: string): Promise<PaymentIntent>;
    cancel(txId: string): Promise<void>;
  };
  auth: {
    login(phone: string, password: string): Promise<User>;
    logout(): Promise<void>;
  };
  signup: {
    start(draft: SignupDraft): Promise<void>;
    verify(phone: string, code: string): Promise<User>;
    resend(phone: string): Promise<void>;
  };
  organizers: {
    list(): Promise<Organizer[]>;
    following(): Promise<string[]>;
    follow(id: string): Promise<void>;
    unfollow(id: string): Promise<void>;
  };
}
