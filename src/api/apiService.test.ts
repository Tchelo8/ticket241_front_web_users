import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, ENDPOINTS, OtpError, httpApi, request } from './apiService';

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe('apiService — request()', () => {
  it('appelle API_BASE_URL + chemin, avec le cookie de session', async () => {
    const fetchMock = respond(200, [{ id: 'jazz' }]);
    vi.stubGlobal('fetch', fetchMock);
    await expect(httpApi.events.list()).resolves.toEqual([{ id: 'jazz' }]);
    expect(fetchMock).toHaveBeenCalledWith(API_BASE_URL + '/events', expect.objectContaining({ method: 'GET', credentials: 'include' }));
  });

  it('envoie le corps en JSON', async () => {
    const fetchMock = respond(200, { txId: 'tx_1', expiresAt: '2026-10-08T12:00:00Z' });
    vi.stubGlobal('fetch', fetchMock);
    const req = { eventId: 'jazz', std: 2, vip: 0, method: 'airtel' as const, name: 'Alida', phone: '074123456', amount: 27000 };
    await httpApi.payments.create(req);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + ENDPOINTS.payments);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(req);
  });

  it('accepte une réponse vide (204)', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(request(ENDPOINTS.logout, { method: 'POST' })).resolves.toBeUndefined();
  });

  it('lève une ApiError avec le statut et le code du serveur', async () => {
    vi.stubGlobal('fetch', respond(404, { error: 'not_found' }));
    const err = await httpApi.events.get('inconnu').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: 'not_found' });
  });

  it('encode les identifiants dans les routes', () => {
    expect(ENDPOINTS.follow('a/b c')).toBe('/organizers/a%2Fb%20c/follow');
  });
});

describe('apiService — vérification SMS', () => {
  it.each([
    [400, { error: 'invalid' }, 'invalid'],
    [400, { error: 'expired' }, 'expired'],
    [410, {}, 'expired'],
    [429, {}, 'too_many'],
  ])('HTTP %i %j → OtpError « %s »', async (status, body, code) => {
    vi.stubGlobal('fetch', respond(status, body));
    const err = await httpApi.signup.verify('074123456', '1234').catch((e) => e);
    expect(err).toBeInstanceOf(OtpError);
    expect(err.code).toBe(code);
  });

  it('laisse passer les autres erreurs', async () => {
    vi.stubGlobal('fetch', respond(500, { error: 'boom' }));
    await expect(httpApi.signup.verify('074123456', '1234')).rejects.toBeInstanceOf(ApiError);
  });
});
