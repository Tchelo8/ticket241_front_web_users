import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/types';
import { loginErrorMessage } from '../pages/LoginPage';
import { tokenExpiry, useAuth, watchSessionExpiry } from './auth';

const USER = { firstName: 'Jean', lastName: 'Mba', email: 'jean@mail.com', phone: '074123456' };
const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (exp: number) => `${b64url({ alg: 'HS256' })}.${b64url({ sub: '+241074123456', exp })}.sig`;

afterEach(() => {
  vi.useRealTimers();
  useAuth.getState().signOut();
});

describe('session JWT', () => {
  it('lit la date d’expiration du JWT', () => {
    expect(tokenExpiry(jwt(1_760_086_400))).toBe(1_760_086_400_000);
    expect(tokenExpiry('pas-un-jwt')).toBeNull();
  });

  it('ferme la session à l’expiration du JWT', () => {
    vi.useFakeTimers();
    const stop = watchSessionExpiry();
    useAuth.getState().signIn(USER, jwt(Math.floor(Date.now() / 1000) + 60));
    vi.advanceTimersByTime(59_000);
    expect(useAuth.getState().user).not.toBeNull();
    vi.advanceTimersByTime(2_000);
    expect(useAuth.getState()).toMatchObject({ user: null, token: null });
    stop();
  });

  it('écarte une session expirée à la réhydratation', async () => {
    localStorage.setItem('t241.session', JSON.stringify({ state: { user: USER, token: jwt(1) }, version: 0 }));
    await useAuth.persist.rehydrate();
    expect(useAuth.getState().user).toBeNull();
  });
});

describe('loginErrorMessage', () => {
  it.each([
    [new ApiError(401, undefined, { message: 'Numéro de téléphone ou mot de passe incorrect' }), 'Numéro de téléphone ou mot de passe incorrect'],
    [new ApiError(403, undefined, { message: 'Compte non vérifié. … /api/auth/verify-otp …' }), "Votre compte n'est pas encore vérifié. Saisissez le code reçu par e-mail pour l'activer."],
    [new ApiError(500, undefined, { message: 'Une erreur interne' }), 'Une erreur est survenue, réessayez plus tard.'],
    [new ApiError(502, undefined, '<html>Bad Gateway</html>'), 'Une erreur est survenue, réessayez plus tard.'],
    [new TypeError('Failed to fetch'), 'Connexion impossible. Vérifiez votre connexion internet et réessayez.'],
  ])('%s → message affiché', (err, msg) => {
    expect(loginErrorMessage(err)).toBe(msg);
  });
});
