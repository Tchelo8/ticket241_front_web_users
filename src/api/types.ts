/** Types et erreurs du service API (apiService). */
import type { City, Event, Organizer, PaymentMethod, Ticket, User } from '../types';

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

/** Erreur métier de la vérification du code reçu par e-mail, avec le message du serveur s'il y en a un. */
export class OtpError extends Error {
  constructor(
    public readonly code: OtpErrorCode,
    public readonly serverMessage?: string,
  ) {
    super(serverMessage ?? code);
    this.name = 'OtpError';
  }
}

/* ---------- Charges utiles ---------- */

/** Une ligne du panier : X billets d'une catégorie. */
export type CartItem = { ticketCategoryId: number; quantity: number };

/** Réservation d'un panier (plusieurs catégories possibles, payées en une fois). */
export type ReserveRequest = {
  eventId: number;
  items: CartItem[];
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
};

/**
 * Accès à une commande : avec un compte (JWT de la session), ou sans compte grâce au jeton
 * de la commande (`guestToken`, donné une seule fois à la réservation).
 */
export type OrderAccess = { orderId: string; guestToken?: string };

export type Reservation = OrderAccess & { tickets: Ticket[]; total: number };

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

/** Session ouverte : profil + JWT. */
export type Session = { user: User; token: string | null };

/** Session de récupération des billets sans compte (ouverte par un code reçu par e-mail). */
export type GuestSession = { sessionToken: string; expiresAt: string };

/** Alertes e-mail du compte (préférences de notification-service). */
export type EmailAlerts = { ticketUpdates: boolean; eventReminders: boolean; promotions: boolean };

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
  organizers: {
    list(): Promise<Organizer[]>;
  };
  /** Favoris du compte connecté (JWT). Sans compte, ils restent dans le navigateur (store prefs). */
  favorites: {
    list(): Promise<Event[]>;
    add(eventId: string): Promise<void>;
    remove(eventId: string): Promise<void>;
    /** Verse les favoris du navigateur sur le compte ; renvoie la liste complète du compte. */
    import(eventIds: string[]): Promise<Event[]>;
  };
  orders: {
    /** Avec compte si une session est ouverte, sinon sans compte (téléphone obligatoire). */
    reserve(req: ReserveRequest, guest: boolean): Promise<Reservation>;
    get(order: OrderAccess): Promise<Ticket[]>;
    /** Lance le paiement Mobile Money des billets réservés de la commande. */
    pay(order: OrderAccess, method: PaymentMethod, phone: string): Promise<void>;
    downloadPdf(order: OrderAccess): Promise<Blob>;
    /** Rattache à son compte une commande passée sans compte (jeton de la commande requis). */
    claim(order: Required<OrderAccess>): Promise<Ticket[]>;
  };
  tickets: {
    list(): Promise<Ticket[]>;
    get(ref: string): Promise<Ticket>;
    downloadPdf(ref: string): Promise<Blob>;
  };
  guestAccess: {
    requestCode(phone: string): Promise<string>;
    verify(phone: string, code: string): Promise<GuestSession>;
    tickets(sessionToken: string): Promise<Ticket[]>;
    downloadPdf(sessionToken: string, ref: string): Promise<Blob>;
  };
  auth: {
    login(phone: string, password: string): Promise<Session>;
    logout(): Promise<void>;
    updateProfile(firstName: string, lastName: string): Promise<User>;
    deleteAccount(password: string): Promise<void>;
  };
  preferences: {
    get(): Promise<EmailAlerts>;
    update(p: Partial<EmailAlerts>): Promise<EmailAlerts>;
  };
  signup: {
    start(draft: SignupDraft): Promise<void>;
    /** Code valide : le compte est activé et la session ouverte (JWT renvoyé par l'auth-service). */
    verify(phone: string, code: string): Promise<Session>;
    resend(phone: string): Promise<void>;
  };
}
