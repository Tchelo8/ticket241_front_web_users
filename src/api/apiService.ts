/**
 * Service API — point de passage unique de tous les appels au serveur.
 *
 * - `API_BASE_URL` : adresse centrale de l'API, lue dans VITE_API_URL (fichier .env).
 * - `ENDPOINTS`    : toutes les routes, au même endroit.
 * - `request()`    : la seule fonction de l'application qui appelle `fetch`.
 * - `apiService`   : les opérations, regroupées par domaine (events, tickets, payments,
 *                    auth, signup, organizers).
 *
 * Chaque domaine répond avec l'API réelle ou avec le faux serveur (mockServer.ts) selon
 * VITE_USE_MOCKS / VITE_LIVE_API (voir lib/apiMode.ts) : les écrans n'ont rien à changer.
 */
import { isLive, type ApiDomain } from '../lib/apiMode';
import { fromIntlPhone, phoneDigits } from '../lib/format';
import { useAuth } from '../store/auth';
import { mockApi } from './mockServer';
import { toCity, toEvent, toVisibleEvent, type ApiCity, type ApiEvent, type ApiPage } from './eventAdapter';
import type { User } from '../types';
import { ApiError, OtpError, type ApiService, type AuthResponse, type OtpErrorCode, type Session } from './types';

export * from './types';

/** Adresse de base de l'API (sans barre finale). En dev : « /api », relayé par le proxy Vite. */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');

const enc = encodeURIComponent;

/** Routes de l'API. */
export const ENDPOINTS = {
  events: '/events/all',
  event: (uuid: string) => `/events/${enc(uuid)}`,
  cities: '/events/cities/get/all/active',

  tickets: '/me/tickets',
  ticket: (ref: string) => `/me/tickets/${enc(ref)}`,

  payments: '/payments',
  payment: (txId: string) => `/payments/${enc(txId)}`,
  paymentResend: (txId: string) => `/payments/${enc(txId)}/resend`,
  paymentCancel: (txId: string) => `/payments/${enc(txId)}/cancel`,

  login: '/auth/login',

  signupStart: '/auth/signup/start',
  signupVerify: '/auth/signup/verify',
  signupResend: '/auth/signup/resend',

  organizers: '/organizers',
  following: '/me/following',
  follow: (id: string) => `/organizers/${enc(id)}/follow`,
} as const;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

/**
 * Appel HTTP vers `API_BASE_URL + path`, corps en JSON.
 * Si une session est ouverte, son JWT part dans `Authorization: Bearer …` ; un 401 sur
 * un appel authentifié signifie que le JWT n'est plus valable : la session est fermée.
 * Lève une `ApiError` (statut, message et erreurs de champs du serveur) si la réponse n'est pas 2xx.
 */
export async function request<T = void>(path: string, { method = 'GET', body, signal, headers }: RequestOptions = {}): Promise<T> {
  const token = useAuth.getState().token;
  const res = await fetch(API_BASE_URL + path, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
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

const OTP_CODES: OtpErrorCode[] = ['invalid', 'expired', 'too_many'];

/** Traduit les erreurs de la vérification SMS : { error } ou, à défaut, HTTP 410 / 429. */
const asOtpError = (err: unknown): never => {
  if (err instanceof ApiError) {
    if (err.code && OTP_CODES.includes(err.code as OtpErrorCode)) throw new OtpError(err.code as OtpErrorCode);
    if (err.status === 410) throw new OtpError('expired');
    if (err.status === 429) throw new OtpError('too_many');
  }
  throw err;
};

/** Taille des pages demandées pour charger un catalogue complet, et garde-fou. */
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

/** Implémentation HTTP réelle. */
export const httpApi: ApiService = {
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
  tickets: {
    list: () => request(ENDPOINTS.tickets),
    get: (ref) => request(ENDPOINTS.ticket(ref)),
  },
  payments: {
    create: (req) => request(ENDPOINTS.payments, { method: 'POST', body: req }),
    status: (txId) => request(ENDPOINTS.payment(txId)),
    resend: (txId) => request(ENDPOINTS.paymentResend(txId), { method: 'POST' }),
    cancel: (txId) => request(ENDPOINTS.paymentCancel(txId), { method: 'POST' }),
  },
  auth: {
    login: (phone, password) =>
      request<AuthResponse>(ENDPOINTS.login, { method: 'POST', body: { phone: phoneDigits(phone), password } }).then(toSession),
    // Pas de route de déconnexion : le JWT est simplement oublié côté front (store auth).
    logout: async () => {},
  },
  signup: {
    start: (draft) => request(ENDPOINTS.signupStart, { method: 'POST', body: draft }),
    verify: (phone, code) => request<User>(ENDPOINTS.signupVerify, { method: 'POST', body: { phone, code } }).catch(asOtpError),
    resend: (phone) => request(ENDPOINTS.signupResend, { method: 'POST', body: { phone } }),
  },
  organizers: {
    list: () => request(ENDPOINTS.organizers),
    following: () => request(ENDPOINTS.following),
    follow: (id) => request(ENDPOINTS.follow(id), { method: 'POST' }),
    unfollow: (id) => request(ENDPOINTS.follow(id), { method: 'DELETE' }),
  },
};

const pick = <K extends ApiDomain>(domain: K): ApiService[K] => (isLive(domain) ? httpApi : mockApi)[domain];

/** Le service utilisé par toute l'application : API réelle ou faux serveur, domaine par domaine. */
export const apiService: ApiService = {
  events: pick('events'),
  cities: pick('cities'),
  tickets: pick('tickets'),
  payments: pick('payments'),
  auth: pick('auth'),
  signup: pick('signup'),
  organizers: pick('organizers'),
};
