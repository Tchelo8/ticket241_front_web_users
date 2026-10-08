/**
 * Inscription en deux temps avec vérification du numéro par SMS.
 *
 *   POST /auth/signup/start  { firstName, lastName, email, phone, password }
 *   POST /auth/signup/verify { phone, code }  → profil, session ouverte (cookie httpOnly)
 *   POST /auth/signup/resend { phone }
 *
 * Les écrans ne dépendent que de l'interface `SignupApi` : le client mocké
 * (auth.mock.ts) sert tant que VITE_USE_MOCKS n'est pas à « false ».
 */
import { USE_MOCKS } from '../lib/clock';
import { mockSignupApi } from './auth.mock';
import { OtpError, type SignupApi } from './auth.types';

export * from './auth.types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
  // Contrat attendu : { error: 'invalid' | 'expired' | 'too_many' } (sinon HTTP 410 / 429).
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (payload.error === 'invalid' || payload.error === 'expired' || payload.error === 'too_many') {
    throw new OtpError(payload.error);
  }
  if (res.status === 410) throw new OtpError('expired');
  if (res.status === 429) throw new OtpError('too_many');
  throw new Error(`HTTP ${res.status}`);
}

export const httpSignupApi: SignupApi = {
  start: (draft) => post('/auth/signup/start', draft),
  verify: (phone, code) => post('/auth/signup/verify', { phone, code }),
  resend: (phone) => post('/auth/signup/resend', { phone }),
};

export const signupApi: SignupApi = USE_MOCKS ? mockSignupApi : httpSignupApi;
