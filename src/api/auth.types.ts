import type { User } from '../types';

export type SignupDraft = User & { password: string };

export type OtpErrorCode = 'invalid' | 'expired' | 'too_many';

/** Erreur métier renvoyée par la vérification du code. */
export class OtpError extends Error {
  constructor(public readonly code: OtpErrorCode) {
    super(code);
    this.name = 'OtpError';
  }
}

export interface SignupApi {
  start(draft: SignupDraft): Promise<void>;
  verify(phone: string, code: string): Promise<User>;
  resend(phone: string): Promise<void>;
}
