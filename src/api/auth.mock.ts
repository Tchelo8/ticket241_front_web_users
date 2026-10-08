/**
 * Client d'inscription mocké.
 * - « 0000 » : code incorrect ; au 5e essai incorrect, trop de tentatives.
 * - tout autre code à 4 chiffres : succès.
 * - un code expire 10 minutes après son envoi ; un renvoi remet les essais à zéro.
 */
import { OtpError, type SignupApi, type SignupDraft } from './auth.types';

export const MOCK_INVALID_CODE = '0000';
export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

type Pending = { draft: Omit<SignupDraft, 'password'>; sentAt: number; failures: number };
const pending = new Map<string, Pending>();

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (phone: string) => phone.replace(/\D/g, '');

/** Délai simulé du réseau (mis à 0 dans les tests). */
export const mockLatency = { ms: 500 };

export const mockSignupApi: SignupApi = {
  async start(draft) {
    await wait(mockLatency.ms);
    const { password: _password, ...rest } = draft;
    void _password;
    pending.set(key(draft.phone), { draft: rest, sentAt: Date.now(), failures: 0 });
  },

  async verify(phone, code) {
    await wait(mockLatency.ms);
    const p = pending.get(key(phone));
    if (!p) throw new OtpError('expired');
    if (p.failures >= MAX_ATTEMPTS) throw new OtpError('too_many');
    if (Date.now() - p.sentAt > OTP_TTL_MS) throw new OtpError('expired');
    if (code === MOCK_INVALID_CODE) {
      p.failures += 1;
      throw new OtpError(p.failures >= MAX_ATTEMPTS ? 'too_many' : 'invalid');
    }
    pending.delete(key(phone));
    return p.draft;
  },

  async resend(phone) {
    await wait(mockLatency.ms);
    const p = pending.get(key(phone));
    // Nouveau code : le compteur d'essais repart de zéro.
    if (p) {
      p.sentAt = Date.now();
      p.failures = 0;
    }
  },
};

/** Remise à zéro entre deux tests. */
export const resetMockSignup = () => pending.clear();
