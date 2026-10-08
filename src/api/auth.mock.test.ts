import { beforeEach, describe, expect, it } from 'vitest';
import { OtpError } from './auth';
import { MAX_ATTEMPTS, mockLatency, mockSignupApi, resetMockSignup } from './auth.mock';

const draft = { firstName: 'Alida', lastName: 'Nzé Mba', email: 'a@b.ga', phone: '074123456', password: 'Motdepasse1' };

beforeEach(() => {
  mockLatency.ms = 0;
  resetMockSignup();
});

describe('mockSignupApi', () => {
  it('« 0000 » est refusé, tout autre code réussit', async () => {
    await mockSignupApi.start(draft);
    await expect(mockSignupApi.verify(draft.phone, '0000')).rejects.toEqual(new OtpError('invalid'));
    await expect(mockSignupApi.verify(draft.phone, '1234')).resolves.toMatchObject({ firstName: 'Alida', phone: draft.phone });
  });

  it('ne renvoie jamais le mot de passe', async () => {
    await mockSignupApi.start(draft);
    expect(await mockSignupApi.verify(draft.phone, '5678')).not.toHaveProperty('password');
  });

  it('passe à « trop de tentatives » après plusieurs échecs', async () => {
    await mockSignupApi.start(draft);
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await expect(mockSignupApi.verify(draft.phone, '0000')).rejects.toMatchObject({ code: 'invalid' });
    }
    await expect(mockSignupApi.verify(draft.phone, '0000')).rejects.toMatchObject({ code: 'too_many' });
    await expect(mockSignupApi.verify(draft.phone, '1234')).rejects.toMatchObject({ code: 'too_many' });
  });
});
