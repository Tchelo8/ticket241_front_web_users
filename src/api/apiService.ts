/**
 * Service API — point de passage unique de tous les appels au serveur.
 *
 * - `API_BASE_URL` : adresse centrale de l'API (la Gateway), lue dans VITE_API_URL (fichier .env).
 * - `ENDPOINTS`    : toutes les routes, au même endroit.
 * - `request()`    : la seule fonction de l'application qui appelle `fetch`.
 * - `apiService`   : les opérations, regroupées par domaine.
 *
 * Toutes les données viennent de l'API : il n'y a pas de données de démonstration.
 */
import { fromIntlPhone, phoneDigits } from '../lib/format';
import { accountIdOf, useAuth } from '../store/auth';
import { toCity, toEvent, toVisibleEvent, type ApiCity, type ApiEvent, type ApiPage } from './eventAdapter';
import {
  toOrganizer,
  toTicket,
  type ApiGuestReservation,
  type ApiPublicStructure,
  type ApiReservation,
  type ApiTicket,
} from './ticketAdapter';
import type { PaymentMethod, User } from '../types';
import { ApiError, OtpError, type ApiService, type AuthResponse, type EmailAlerts, type OrderAccess, type Session } from './types';

export * from './types';

/** Adresse de base de l'API (sans barre finale). En dev : « /api », relayé par le proxy Vite. */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');

const enc = encodeURIComponent;

/** Routes de l'API (chemins de la Gateway, sans le préfixe /api). */
export const ENDPOINTS = {
  events: '/events/all',
  event: (uuid: string) => `/events/${enc(uuid)}`,
  cities: '/events/cities/get/all/active',
  organizers: '/events/structures/public',

  // Favoris du compte (JWT)
  favorites: '/events/favorites',
  favorite: (uuid: string) => `/events/favorites/${enc(uuid)}`,
  favoritesImport: '/events/favorites/import',

  // Commandes avec compte (JWT)
  reserve: '/tickets/reserve',
  order: (orderId: string) => `/tickets/order/${enc(orderId)}`,
  purchase: '/tickets/purchase',
  orderPdf: (orderId: string) => `/tickets/order/${enc(orderId)}/download`,
  claimGuestOrder: (orderId: string) => `/tickets/order/${enc(orderId)}/claim-guest`,

  // Commandes sans compte (jeton de la commande dans X-Guest-Token)
  guestReserve: '/tickets/guest/reserve',
  guestOrder: (orderId: string) => `/tickets/guest/orders/${enc(orderId)}`,
  guestPurchase: (orderId: string) => `/tickets/guest/orders/${enc(orderId)}/purchase`,
  guestOrderPdf: (orderId: string) => `/tickets/guest/orders/${enc(orderId)}/download`,

  // Billets sans compte retrouvés par code (session dans X-Guest-Session)
  guestCodeRequest: '/tickets/guest/access/request',
  guestCodeVerify: '/tickets/guest/access/verify',
  guestTickets: '/tickets/guest/access/tickets',
  guestTicketPdf: (ref: string) => `/tickets/guest/access/tickets/${enc(ref)}/download`,

  // Billets du compte
  tickets: '/tickets/my-tickets',
  ticket: (ref: string) => `/tickets/${enc(ref)}`,
  ticketPdf: (ref: string) => `/tickets/${enc(ref)}/download`,

  login: '/auth/login',
  me: '/auth/me',
  signupStart: '/auth/register',
  signupVerify: '/auth/verify-otp',
  signupResend: '/auth/resend-otp',

  // Alertes e-mail (notification-service, par id numérique du compte)
  preferences: (accountId: number) => `/notifications/preferences/${accountId}`,
  updatePreferences: '/notifications/preferences',
} as const;

export const GUEST_TOKEN_HEADER = 'X-Guest-Token';
export const GUEST_SESSION_HEADER = 'X-Guest-Session';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Corps attendu : JSON (défaut) ou fichier (PDF). */
  as?: 'json' | 'blob';
};

/**
 * Appel HTTP vers `API_BASE_URL + path`, corps en JSON.
 * Si une session est ouverte, son JWT part dans `Authorization: Bearer …` ; un 401 sur
 * un appel authentifié signifie que le JWT n'est plus valable : la session est fermée.
 * Lève une `ApiError` (statut, message et erreurs de champs du serveur) si la réponse n'est pas 2xx.
 */
export async function request<T = void>(
  path: string,
  { method = 'GET', body, signal, headers, as = 'json' }: RequestOptions = {},
): Promise<T> {
  const token = useAuth.getState().token;
  const res = await fetch(API_BASE_URL + path, {
    method,
    signal,
    headers: {
      Accept: as === 'blob' ? 'application/pdf' : 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.ok && as === 'blob') return (await res.blob()) as T;
  const text = await res.text();
  const data: unknown = text ? safeJson(text) : undefined;
  if (!res.ok) {
    if (res.status === 401 && token && useAuth.getState().token === token) useAuth.getState().signOut();
    const code = typeof data === 'object' && data && 'error' in data ? String((data as { error: unknown }).error) : undefined;
    throw new ApiError(res.status, code, data);
  }
  return data as T;
}

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Traduit les erreurs de la vérification du code (auth-service) :
 * 401 = code refusé (incorrect, expiré ou trop d'essais selon le message), 429 = renvoi trop rapproché.
 */
export const asOtpError = (err: unknown): never => {
  if (err instanceof ApiError) {
    const msg = err.serverMessage;
    const lower = (msg ?? '').toLowerCase();
    if (err.status === 429 || lower.includes('maximum') || lower.includes('trop de')) throw new OtpError('too_many', msg);
    if (lower.includes('expir')) throw new OtpError('expired', msg);
    if (err.status === 401 || err.status === 400) throw new OtpError('invalid', msg);
  }
  throw err;
};

/** Taille des pages demandées pour charger une liste complète, et garde-fou. */
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

/** Parcourt toutes les pages d'une liste Spring (`?page=…&size=…`). */
export async function fetchAllPages<T>(path: string, query: Record<string, string> = {}): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const qs = new URLSearchParams({ ...query, page: String(page), size: String(PAGE_SIZE) });
    const res = await request<ApiPage<T>>(`${path}?${qs}`);
    items.push(...(res?.content ?? []));
    if (!res || res.last || page + 1 >= res.totalPages) break;
  }
  return items;
}

/** Réponse de l'auth-service → session de l'application. */
export const toSession = (r: AuthResponse): Session => ({
  user: { firstName: r.firstName ?? '', lastName: r.lastName ?? '', email: r.email ?? '', phone: fromIntlPhone(r.phone ?? '') },
  token: r.token,
});

/** Moyen de paiement du front → valeur attendue par ticket-service. */
export const API_PAYMENT_METHOD: Record<PaymentMethod, string> = {
  airtel: 'AIRTEL_MONEY',
  moov: 'MOOV_MONEY',
  card: 'CARD',
};

const guestHeaders = (order: OrderAccess) =>
  order.guestToken ? { [GUEST_TOKEN_HEADER]: order.guestToken } : undefined;

/** Billets réservés (prêts à payer) d'une commande. */
const payableIds = (tickets: { status: string; id: number }[]) => tickets.filter((t) => t.status === 'RESERVED').map((t) => t.id);

type ApiPreferences = { emailTicketUpdates: boolean | null; emailEventReminders: boolean | null; emailPromotions: boolean | null };

const toEmailAlerts = (p: ApiPreferences): EmailAlerts => ({
  ticketUpdates: p.emailTicketUpdates !== false,
  eventReminders: p.emailEventReminders !== false,
  promotions: p.emailPromotions === true,
});

/** Id du compte connecté (dans le JWT) : sans session, pas de préférences. */
const requireAccountId = () => {
  const id = accountIdOf(useAuth.getState().token);
  if (id === null) throw new ApiError(401, undefined, { message: 'Connectez-vous pour gérer vos alertes' });
  return id;
};

/** Implémentation HTTP : le seul service de l'application. */
export const apiService: ApiService = {
  events: {
    // Événements publiés, publics et actifs, par date croissante.
    list: () =>
      fetchAllPages<ApiEvent>(ENDPOINTS.events, { sortBy: 'startDate', sortDirection: 'asc' }).then((l) => l.map(toEvent)),
    // Le détail compte une vue côté serveur à chaque appel.
    get: (id) => request<ApiEvent>(ENDPOINTS.event(id)).then(toVisibleEvent),
  },
  cities: {
    list: () => request<ApiCity[]>(ENDPOINTS.cities).then((l) => (l ?? []).map(toCity)),
  },
  organizers: {
    list: () => request<ApiPublicStructure[]>(ENDPOINTS.organizers).then((l) => (l ?? []).map(toOrganizer)),
  },
  favorites: {
    // Du plus récent au plus ancien ; les événements repassés en brouillon sont masqués par le serveur.
    list: () => request<ApiEvent[]>(ENDPOINTS.favorites).then((l) => (l ?? []).map(toEvent)),
    add: (id) => request(ENDPOINTS.favorite(id), { method: 'PUT' }),
    remove: (id) => request(ENDPOINTS.favorite(id), { method: 'DELETE' }),
    // 100 au plus par appel (limite du serveur)
    import: (ids) =>
      request<ApiEvent[]>(ENDPOINTS.favoritesImport, { method: 'POST', body: { eventUuids: ids.slice(0, 100) } }).then(
        (l) => (l ?? []).map(toEvent),
      ),
  },
  orders: {
    reserve: async (req, guest) => {
      const phone = phoneDigits(req.phone);
      if (guest) {
        const r = await request<ApiGuestReservation>(ENDPOINTS.guestReserve, {
          method: 'POST',
          body: {
            eventId: req.eventId,
            items: req.items,
            phone,
            email: req.email || undefined,
            firstName: req.firstName,
            lastName: req.lastName,
            source: 'web',
          },
        });
        return {
          orderId: r.orderId,
          guestToken: r.accessToken,
          tickets: r.reservation.tickets.map(toTicket),
          total: Number(r.reservation.totalAmount) || 0,
        };
      }
      const r = await request<ApiReservation>(ENDPOINTS.reserve, {
        method: 'POST',
        body: {
          eventId: req.eventId,
          items: req.items,
          userPhone: phone,
          userEmail: req.email || undefined,
          userFirstName: req.firstName,
          userLastName: req.lastName,
          source: 'web',
        },
      });
      return { orderId: r.orderId, tickets: r.tickets.map(toTicket), total: Number(r.totalAmount) || 0 };
    },
    get: (order) =>
      request<ApiTicket[]>(order.guestToken ? ENDPOINTS.guestOrder(order.orderId) : ENDPOINTS.order(order.orderId), {
        headers: guestHeaders(order),
      }).then((l) => (l ?? []).map(toTicket)),
    pay: async (order, method, phone) => {
      if (order.guestToken) {
        // Sans compte, le paiement part toujours du numéro de la commande (vérifié côté serveur)
        await request(ENDPOINTS.guestPurchase(order.orderId), {
          method: 'POST',
          body: { paymentMethod: API_PAYMENT_METHOD[method] },
          headers: guestHeaders(order),
        });
        return;
      }
      // L'achat attend les id numériques des billets RESERVED : on relit la commande brute
      const raw = await request<(ApiTicket & { id: number })[]>(ENDPOINTS.order(order.orderId));
      await request(ENDPOINTS.purchase, {
        method: 'POST',
        body: { ticketIds: payableIds(raw ?? []), paymentMethod: API_PAYMENT_METHOD[method], mobileMoneyNumber: phoneDigits(phone) },
      });
    },
    downloadPdf: (order) =>
      request<Blob>(order.guestToken ? ENDPOINTS.guestOrderPdf(order.orderId) : ENDPOINTS.orderPdf(order.orderId), {
        headers: guestHeaders(order),
        as: 'blob',
      }),
    claim: (order) =>
      request<ApiTicket[]>(ENDPOINTS.claimGuestOrder(order.orderId), { method: 'POST', headers: guestHeaders(order) }).then(
        (l) => (l ?? []).map(toTicket),
      ),
  },
  tickets: {
    list: () =>
      fetchAllPages<ApiTicket>(ENDPOINTS.tickets, { sortBy: 'createdAt', sortDirection: 'DESC' }).then((l) => l.map(toTicket)),
    get: (ref) => request<ApiTicket>(ENDPOINTS.ticket(ref)).then(toTicket),
    downloadPdf: (ref) => request<Blob>(ENDPOINTS.ticketPdf(ref), { as: 'blob' }),
  },
  guestAccess: {
    requestCode: (phone) =>
      request<{ message: string }>(ENDPOINTS.guestCodeRequest, { method: 'POST', body: { phone: phoneDigits(phone) } }).then(
        (r) => r?.message ?? '',
      ),
    verify: (phone, code) =>
      request<{ sessionToken: string; expiresAt: string }>(ENDPOINTS.guestCodeVerify, {
        method: 'POST',
        body: { phone: phoneDigits(phone), code },
      }),
    tickets: (sessionToken) =>
      request<ApiTicket[]>(ENDPOINTS.guestTickets, { headers: { [GUEST_SESSION_HEADER]: sessionToken } }).then((l) =>
        (l ?? []).map(toTicket),
      ),
    downloadPdf: (sessionToken, ref) =>
      request<Blob>(ENDPOINTS.guestTicketPdf(ref), { headers: { [GUEST_SESSION_HEADER]: sessionToken }, as: 'blob' }),
  },
  auth: {
    login: (phone, password) =>
      request<AuthResponse>(ENDPOINTS.login, { method: 'POST', body: { phone: phoneDigits(phone), password } }).then(toSession),
    // Pas de route de déconnexion : le JWT est simplement oublié côté front (store auth).
    logout: async () => {},
    updateProfile: (firstName, lastName) =>
      request<{ firstName: string; lastName: string; email: string; phone: string }>(ENDPOINTS.me, {
        method: 'PUT',
        body: { firstName, lastName },
      }).then((r): User => ({ firstName: r.firstName ?? '', lastName: r.lastName ?? '', email: r.email ?? '', phone: fromIntlPhone(r.phone ?? '') })),
    deleteAccount: async (password) => {
      await request(ENDPOINTS.me, { method: 'DELETE', body: { password } });
    },
  },
  preferences: {
    get: () => request<ApiPreferences>(ENDPOINTS.preferences(requireAccountId())).then(toEmailAlerts),
    update: (p) =>
      request<ApiPreferences>(ENDPOINTS.updatePreferences, {
        method: 'PUT',
        body: {
          userId: requireAccountId(),
          emailTicketUpdates: p.ticketUpdates,
          emailEventReminders: p.eventReminders,
          emailPromotions: p.promotions,
        },
      }).then(toEmailAlerts),
  },
  signup: {
    // Le compte est créé tout de suite (non vérifié) ; le code part par e-mail.
    start: async (draft) => {
      await request(ENDPOINTS.signupStart, {
        method: 'POST',
        body: { ...draft, phone: phoneDigits(draft.phone), email: draft.email.trim() },
      });
    },
    verify: (phone, code) =>
      request<AuthResponse>(ENDPOINTS.signupVerify, { method: 'POST', body: { phone: phoneDigits(phone), code } })
        .then(toSession)
        .catch(asOtpError),
    resend: async (phone) => {
      await request(ENDPOINTS.signupResend, { method: 'POST', body: { phone: phoneDigits(phone) } }).catch(asOtpError);
    },
  },
};

/** Propose un fichier téléchargé (PDF des billets) à l'enregistrement. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
