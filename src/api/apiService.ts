/**
 * Service API — point de passage unique de tous les appels au serveur.
 *
 * - `API_BASE_URL` : adresse centrale de l'API, lue dans VITE_API_URL (fichier .env).
 * - `ENDPOINTS`    : toutes les routes, au même endroit.
 * - `request()`    : la seule fonction de l'application qui appelle `fetch`.
 * - `apiService`   : les opérations, regroupées par domaine (events, tickets, payments,
 *                    auth, signup, organizers).
 *
 * Tant que VITE_USE_MOCKS n'est pas à « false », `apiService` répond avec le faux
 * serveur (mockServer.ts) : les écrans n'ont rien à changer le jour du branchement.
 */
import { USE_MOCKS } from '../lib/clock';
import { mockApi } from './mockServer';
import type { User } from '../types';
import { ApiError, OtpError, type ApiService, type OtpErrorCode } from './types';

export * from './types';

/** Adresse de base de l'API (sans barre finale). Exemple : https://api.ticket241.ga/v1 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');

const enc = encodeURIComponent;

/** Routes de l'API. */
export const ENDPOINTS = {
  events: '/events',
  event: (id: string) => `/events/${enc(id)}`,

  tickets: '/me/tickets',
  ticket: (ref: string) => `/me/tickets/${enc(ref)}`,

  payments: '/payments',
  payment: (txId: string) => `/payments/${enc(txId)}`,
  paymentResend: (txId: string) => `/payments/${enc(txId)}/resend`,
  paymentCancel: (txId: string) => `/payments/${enc(txId)}/cancel`,

  login: '/auth/login',
  logout: '/auth/logout',

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
 * Appel HTTP vers `API_BASE_URL + path`.
 * Session par cookie httpOnly (credentials: 'include'), corps en JSON.
 * Lève une `ApiError` (statut + code `{ error }` du serveur) si la réponse n'est pas 2xx.
 */
export async function request<T = void>(path: string, { method = 'GET', body, signal, headers }: RequestOptions = {}): Promise<T> {
  const res = await fetch(API_BASE_URL + path, {
    method,
    credentials: 'include',
    signal,
    headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data: unknown = text ? safeJson(text) : undefined;
  if (!res.ok) {
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

/** Implémentation HTTP réelle. */
export const httpApi: ApiService = {
  events: {
    list: () => request(ENDPOINTS.events),
    get: (id) => request(ENDPOINTS.event(id)),
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
    login: (phone, password) => request(ENDPOINTS.login, { method: 'POST', body: { phone, password } }),
    logout: () => request(ENDPOINTS.logout, { method: 'POST' }),
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

/** Le service utilisé par toute l'application. */
export const apiService: ApiService = USE_MOCKS ? mockApi : httpApi;
