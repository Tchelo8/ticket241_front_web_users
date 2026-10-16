import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, ENDPOINTS, OtpError, httpApi, request } from './apiService';
import { useAuth } from '../store/auth';

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  useAuth.getState().signOut();
});

const USER = { firstName: 'Jean', lastName: 'Mba', email: 'jean@mail.com', phone: '074123456' };

describe('apiService — request()', () => {
  it('appelle API_BASE_URL + chemin, sans Authorization hors session', async () => {
    const fetchMock = respond(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await httpApi.cities.list();
    expect(fetchMock).toHaveBeenCalledWith(API_BASE_URL + '/events/cities/get/all/active', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('envoie le JWT de la session dans Authorization', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    const fetchMock = respond(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await httpApi.tickets.list();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-123');
  });

  it('ferme la session sur un 401 d’un appel authentifié', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    vi.stubGlobal('fetch', respond(401, { status: 401, message: 'Token expiré' }));
    await expect(httpApi.tickets.list()).rejects.toBeInstanceOf(ApiError);
    expect(useAuth.getState()).toMatchObject({ user: null, token: null });
  });

  it('envoie le corps en JSON', async () => {
    const fetchMock = respond(200, { txId: 'tx_1', expiresAt: '2026-10-08T12:00:00Z' });
    vi.stubGlobal('fetch', fetchMock);
    const req = { eventId: 'jazz', items: [{ ticketTypeId: 'std', quantity: 2 }], method:'airtel' as const, name: 'Alida', phone: '074123456', amount: 27000 };
    await httpApi.payments.create(req);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + ENDPOINTS.payments);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(req);
  });

  it('accepte une réponse vide (204)', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(request(ENDPOINTS.payments, { method: 'POST' })).resolves.toBeUndefined();
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

describe('apiService — connexion (auth-service)', () => {
  const OK = {
    token: 'jwt-abc', type: 'Bearer', phone: '+241074123456', email: 'jean@mail.com', firstName: 'Jean', lastName: 'Mba',
    structureId: null, roles: ['ROLE_USER'], message: 'Connexion réussie sur Ticket241',
    mfaRequired: false, mfaSetupRequired: false, tempToken: null,
  };

  it('envoie uniquement les chiffres saisis et renvoie profil + JWT', async () => {
    const fetchMock = respond(200, OK);
    vi.stubGlobal('fetch', fetchMock);
    const session = await httpApi.auth.login('074 12 34 56', 'secret123');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/auth/login');
    expect(JSON.parse(init.body)).toEqual({ phone: '074123456', password: 'secret123' });
    expect(session).toEqual({ user: USER, token: 'jwt-abc' });
  });

  it('expose le message du serveur (401)', async () => {
    vi.stubGlobal('fetch', respond(401, { status: 401, message: 'Numéro de téléphone ou mot de passe incorrect', path: '/api/auth/login' }));
    const err = await httpApi.auth.login('074123456', 'faux').catch((e) => e);
    expect(err).toMatchObject({ status: 401, serverMessage: 'Numéro de téléphone ou mot de passe incorrect' });
  });

  it('expose les erreurs de validation par champ (400)', async () => {
    const errors = { phone: 'Le numéro de téléphone est requis' };
    vi.stubGlobal('fetch', respond(400, { status: 400, message: 'Erreur de validation', errors }));
    const err = await httpApi.auth.login('', 'x').catch((e) => e);
    expect(err).toMatchObject({ status: 400, fields: errors });
  });
});

describe('apiService — événements et villes (event-service)', () => {
  const API_EVENT = {
    id: 7, uuid: 'u-jazz', name: 'Nuit du Jazz', slug: 'nuit-du-jazz', fullDescription: 'Trois formations.',
    coverImageUrl: null, category: 'CONCERT', categoryDisplayName: 'Concert',
    startDate: '2026-12-20T20:00:00', endDate: null, doorsOpenTime: '19:15:00',
    venueName: 'Institut Français', venueAddress: 'Bord de Mer', cityId: 1, cityName: 'Libreville',
    totalSeats: 450, availableSeats: 186, minPrice: 15000,
    structureId: 3, structureName: 'IFG', organizerName: 'Jean', eventStatus: 'PUBLISHED',
    isFeatured: true, isCancelled: false, minAge: 18, allowRefund: true, viewCount: 42, isSaleOpen: true,
    ticketCategories: [
      { id: 12, uuid: 'c2', name: 'VIP', description: 'Carré', price: 36000, availableSeats: 0, displayOrder: 2, isActive: true, maxTicketsPerOrder: 4, benefits: null, hasAvailableSeats: false },
      { id: 11, uuid: 'c1', name: 'Standard', description: null, price: 15000, availableSeats: 180, displayOrder: 1, isActive: true, maxTicketsPerOrder: 10, benefits: 'Accès général', hasAvailableSeats: true },
      { id: 13, uuid: 'c3', name: 'Archivé', description: null, price: 1, availableSeats: 5, displayOrder: 0, isActive: false, maxTicketsPerOrder: null, benefits: null, hasAvailableSeats: true },
    ],
  };
  const page = (content: unknown[], number: number, totalPages: number) =>
    new Response(JSON.stringify({ content, number, totalPages, last: number + 1 >= totalPages }), { status: 200 });

  it('convertit le détail : dates à l’heure du Gabon, billets actifs triés', async () => {
    vi.stubGlobal('fetch', respond(200, API_EVENT));
    const ev = await httpApi.events.get('u-jazz');
    expect(ev).toMatchObject({
      id: 'u-jazz', category: 'Concert', city: 'Libreville', image: '/images/ticketHome.png',
      startsAt: '2026-12-20T20:00:00+01:00', doorsAt: '2026-12-20T19:15:00+01:00',
      priceFrom: 15000, seatsLeft: 186, minAge: '18 ans', organizer: { id: '3', name: 'IFG' },
      refundable: true, saleOpen: true, cancelled: false, featured: true, views: 42,
    });
    expect(ev.ticketTypes).toEqual([
      { id: '11', name: 'Standard', price: 15000, note: 'Accès général', available: 180, maxPerOrder: 10 },
      { id: '12', name: 'VIP', price: 36000, note: 'Carré', available: 0, maxPerOrder: 4 },
    ]);
  });

  it('traite un brouillon comme introuvable', async () => {
    vi.stubGlobal('fetch', respond(200, { ...API_EVENT, eventStatus: 'DRAFT' }));
    await expect(httpApi.events.get('u-jazz')).rejects.toMatchObject({ status: 404 });
  });

  it('charge toutes les pages du catalogue', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(page([API_EVENT], 0, 2))
      .mockResolvedValueOnce(page([{ ...API_EVENT, uuid: 'u-2' }], 1, 2));
    vi.stubGlobal('fetch', fetchMock);
    const list = await httpApi.events.list();
    expect(list.map((e) => e.id)).toEqual(['u-jazz', 'u-2']);
    expect(fetchMock.mock.calls[0][0]).toBe(API_BASE_URL + '/events/all?sortBy=startDate&sortDirection=asc&page=0&size=100');
    expect(fetchMock.mock.calls[1][0]).toContain('page=1');
  });

  it('convertit les villes actives', async () => {
    vi.stubGlobal('fetch', respond(200, [{ id: 1, uuid: 'v1', name: 'Libreville', country: 'Gabon', countryCode: 'GA', eventCount: 99 }]));
    await expect(httpApi.cities.list()).resolves.toEqual([{ id: '1', name: 'Libreville', region: 'Gabon' }]);
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
