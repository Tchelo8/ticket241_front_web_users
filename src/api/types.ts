/** Types et erreurs partagés par l'API réelle (apiService) et le faux serveur (mockServer). */
import type { Organizer } from '../mocks/organizers';
import type { City, Event, PaymentMethod, PaymentStatus, Ticket, User } from '../types';

/* ---------- Erreurs ---------- */

/**
 * Réponse HTTP en erreur : statut, code métier éventuel ({ error: '…' }) et corps brut.
 * Corps du backend Ticket241 : { status, message, timestamp, path } et, pour une erreur
 * de validation (400), { errors: { champ: message } }.
 */
export class ApiError extends Error {
  /** Message en français du serveur, affichable tel quel. */
  public readonly serverMessage?: string;
  /** Erreurs de validation, champ → message. */
  public readonly fields?: Record<string, string>;

  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown,
  ) {
    const b = typeof body === 'object' && body ? (body as Record<string, unknown>) : {};
    const serverMessage = typeof b.message === 'string' && b.message ? b.message : undefined;
    super(serverMessage ?? code ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.serverMessage = serverMessage;
    if (typeof b.errors === 'object' && b.errors) this.fields = b.errors as Record<string, string>;
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
  /** Quantité par catégorie de billet. */
  items: { ticketTypeId: string; quantity: number }[];
  method: PaymentMethod;
  name: string;
  phone: string;
  amount: number;
};
export type PaymentIntent = { txId: string; expiresAt: string };
export type PaymentState = { status: PaymentStatus; ticketRef?: string };

export type SignupDraft = User & { password: string };

/** Réponse de l'auth-service (login, verify-otp, resend-otp). */
export type AuthResponse = {
  token: string | null;
  type: 'Bearer';
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  message: string;
};

/** Session ouverte : profil + JWT (null avec le faux serveur). */
export type Session = { user: User; token: string | null };

/* ---------- Contrat du service ---------- */

/** Toutes les opérations disponibles côté serveur, regroupées par domaine. */
export interface ApiService {
  events: {
    list(): Promise<Event[]>;
    get(id: string): Promise<Event>;
  };
  cities: {
    list(): Promise<City[]>;
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
    login(phone: string, password: string): Promise<Session>;
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
