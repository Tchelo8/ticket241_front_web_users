import { beforeEach, describe, expect, it } from 'vitest';
import { OtpError } from './types';
import { MAX_OTP_ATTEMPTS, mockApi, mockConfig, resetMockServer } from './mockServer';

const draft = { firstName: 'Alida', lastName: 'Nzé Mba', email: 'a@b.ga', phone: '074123456', password: 'Motdepasse1' };

beforeEach(() => {
  resetMockServer();
  mockConfig.latencyFactor = 0;
});

describe('mockServer — inscription', () => {
  it('« 0000 » est refusé, tout autre code réussit', async () => {
    await mockApi.signup.start(draft);
    await expect(mockApi.signup.verify(draft.phone, '0000')).rejects.toEqual(new OtpError('invalid'));
    await expect(mockApi.signup.verify(draft.phone, '1234')).resolves.toMatchObject({ firstName: 'Alida', phone: draft.phone });
  });

  it('ne renvoie jamais le mot de passe', async () => {
    await mockApi.signup.start(draft);
    expect(await mockApi.signup.verify(draft.phone, '5678')).not.toHaveProperty('password');
  });

  it('passe à « trop de tentatives » après plusieurs échecs, et un renvoi débloque', async () => {
    await mockApi.signup.start(draft);
    for (let i = 1; i < MAX_OTP_ATTEMPTS; i++) {
      await expect(mockApi.signup.verify(draft.phone, '0000')).rejects.toMatchObject({ code: 'invalid' });
    }
    await expect(mockApi.signup.verify(draft.phone, '0000')).rejects.toMatchObject({ code: 'too_many' });
    await expect(mockApi.signup.verify(draft.phone, '1234')).rejects.toMatchObject({ code: 'too_many' });
    await mockApi.signup.resend(draft.phone);
    await expect(mockApi.signup.verify(draft.phone, '1234')).resolves.toMatchObject({ firstName: 'Alida' });
  });
});

describe('mockServer — organisateurs', () => {
  it('mémorise les abonnements', async () => {
    expect(await mockApi.organizers.following()).toEqual(['ifg', 'palenque']);
    await mockApi.organizers.follow('linaf');
    await mockApi.organizers.unfollow('ifg');
    expect(await mockApi.organizers.following()).toEqual(['palenque', 'linaf']);
  });
});
