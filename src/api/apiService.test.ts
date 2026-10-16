import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, ApiError, ENDPOINTS, GUEST_TOKEN_HEADER, OtpError, apiService, request } from './apiService';
import { useAuth } from '../store/auth';

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  useAuth.getState().signOut();
});

const USER = { firstName: 'Jean', lastName: 'Mba', email: 'jean@mail.com', phone: '074123456' };

/** Billet tel que renvoyé par ticket-service (TicketResponseDto). */
const apiTicket = (over: Record<string, unknown> = {}) => ({
  id: 1, uuid: 't-1', ticketNumber: 'TKT-2026-ABCDEFGHJK', qrCode: 't-1|TKT|jeton', orderId: 'o-1',
  eventId: 7, eventUuid: 'u-jazz', eventName: 'Nuit du Jazz', eventStartDate: '2026-12-20T20:00:00',
  eventVenueName: 'Institut Français', eventVenueCityName: 'Libreville',
  ticketCategoryName: 'Standard', ticketCategoryColor: null, finalPrice: 15750,
  status: 'RESERVED', paymentStatus: 'PENDING', expirationDate: '2026-12-01T10:10:00',
  ...over,
});

describe('apiService — request()', () => {
  it('appelle API_BASE_URL + chemin, sans Authorization hors session', async () => {
    const fetchMock = respond(200, []);
    vi.stubGlobal('fetch', fetchMock);
    await apiService.cities.list();
    expect(fetchMock).toHaveBeenCalledWith(API_BASE_URL + '/events/cities/get/all/active', expect.objectContaining({ method: 'GET' }));
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('envoie le JWT de la session dans Authorization', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    const fetchMock = respond(200, { content: [], number: 0, totalPages: 1, last: true });
    vi.stubGlobal('fetch', fetchMock);
    await apiService.tickets.list();
    expect(fetchMock.mock.calls[0][0]).toContain('/tickets/my-tickets');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-123');
  });

  it('ferme la session sur un 401 d’un appel authentifié', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    vi.stubGlobal('fetch', respond(401, { status: 401, message: 'Token expiré' }));
    await expect(apiService.tickets.get('t-1')).rejects.toBeInstanceOf(ApiError);
    expect(useAuth.getState()).toMatchObject({ user: null, token: null });
  });

  it('accepte une réponse vide (204)', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(request(ENDPOINTS.purchase, { method: 'POST' })).resolves.toBeUndefined();
  });

  it('lève une ApiError avec le statut et le code du serveur', async () => {
    vi.stubGlobal('fetch', respond(404, { error: 'not_found' }));
    const err = await apiService.events.get('inconnu').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: 'not_found' });
  });

  it('encode les identifiants dans les routes', () => {
    expect(ENDPOINTS.order('a/b c')).toBe('/tickets/order/a%2Fb%20c');
  });
});

describe('apiService — commandes (ticket-service)', () => {
  const RESERVATION = { orderId: 'o-1', tickets: [apiTicket({ status: 'PENDING' })], ticketCount: 1, totalAmount: 15750, currency: 'XAF' };
  const CART = { eventId: 7, items: [{ ticketCategoryId: 11, quantity: 2 }, { ticketCategoryId: 12, quantity: 1 }], firstName: 'Alida', lastName: 'Nzé Mba', phone: '074 12 34 56', email: 'alida@mail.com' };

  it('réserve tout le panier dans une seule commande avec un compte', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    const fetchMock = respond(201, RESERVATION);
    vi.stubGlobal('fetch', fetchMock);
    const r = await apiService.orders.reserve(CART, false);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/tickets/reserve');
    expect(JSON.parse(init.body)).toMatchObject({
      eventId: 7, items: CART.items, userPhone: '074123456', userEmail: 'alida@mail.com', userFirstName: 'Alida', userLastName: 'Nzé Mba',
    });
    expect(r).toMatchObject({ orderId: 'o-1', total: 15750 });
    expect(r.guestToken).toBeUndefined();
  });

  it('réserve sans compte et garde le jeton de la commande', async () => {
    const fetchMock = respond(201, { orderId: 'o-1', accessToken: 'secret', reservation: RESERVATION });
    vi.stubGlobal('fetch', fetchMock);
    const r = await apiService.orders.reserve(CART, true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/tickets/guest/reserve');
    expect(JSON.parse(init.body)).toMatchObject({ eventId: 7, items: CART.items, phone: '074123456' });
    expect(r).toMatchObject({ orderId: 'o-1', guestToken: 'secret' });
    expect(r.tickets[0]).toMatchObject({ ref: 't-1', status: 'PENDING', eventId: 'u-jazz', eventNumericId: 7 });
  });

  it('lit une commande invité avec son jeton en header', async () => {
    const fetchMock = respond(200, [apiTicket()]);
    vi.stubGlobal('fetch', fetchMock);
    await apiService.orders.get({ orderId: 'o-1', guestToken: 'secret' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/tickets/guest/orders/o-1');
    expect(init.headers[GUEST_TOKEN_HEADER]).toBe('secret');
  });

  it('paie les billets réservés de la commande par mobile money (compte)', async () => {
    useAuth.getState().signIn(USER, 'jwt-123');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([apiTicket({ id: 1 }), apiTicket({ id: 2 }), apiTicket({ id: 3, status: 'EXPIRED' })]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'PROCESSING' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiService.orders.pay({ orderId: 'o-1' }, 'moov', '062 00 00 00');
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(API_BASE_URL + '/tickets/purchase');
    expect(JSON.parse(init.body)).toEqual({ ticketIds: [1, 2], paymentMethod: 'MOOV_MONEY', mobileMoneyNumber: '062000000' });
  });

  it('paie une commande invité depuis le numéro de la commande', async () => {
    const fetchMock = respond(200, { status: 'PROCESSING' });
    vi.stubGlobal('fetch', fetchMock);
    await apiService.orders.pay({ orderId: 'o-1', guestToken: 'secret' }, 'airtel', '');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/tickets/guest/orders/o-1/purchase');
    expect(JSON.parse(init.body)).toEqual({ paymentMethod: 'AIRTEL_MONEY' });
    expect(init.headers[GUEST_TOKEN_HEADER]).toBe('secret');
  });
});

describe('apiService — billets retrouvés par code (sans compte)', () => {
  it('envoie le numéro puis ouvre une session avec le code', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Code envoyé si des billets existent' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sessionToken: 's-1', expiresAt: '2026-12-01T10:30:00' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([apiTicket({ status: 'PAID' })]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiService.guestAccess.requestCode('074 12 34 56')).resolves.toContain('Code envoyé');
    const session = await apiService.guestAccess.verify('074123456', '123456');
    const tickets = await apiService.guestAccess.tickets(session.sessionToken);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ phone: '074123456' });
    expect(fetchMock.mock.calls[2][1].headers['X-Guest-Session']).toBe('s-1');
    expect(tickets[0]).toMatchObject({ status: 'PAID', qrCode: 't-1|TKT|jeton' });
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
    const session = await apiService.auth.login('074 12 34 56', 'secret123');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE_URL + '/auth/login');
    expect(JSON.parse(init.body)).toEqual({ phone: '074123456', password: 'secret123' });
    expect(session).toEqual({ user: USER, token: 'jwt-abc' });
  });

  it('expose le message du serveur (401)', async () => {
    vi.stubGlobal('fetch', respond(401, { status: 401, message: 'Numéro de téléphone ou mot de passe incorrect', path: '/api/auth/login' }));
    const err = await apiService.auth.login('074123456', 'faux').catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 401, serverMessage: 'Numéro de téléphone ou mot de passe incorrect' });
  });

  it('expose les erreurs de validation par champ (400)', async () => {
    const errors = { phone: 'Le numéro de téléphone est requis' };
    vi.stubGlobal('fetch', respond(400, { status: 400, message: 'Erreur de validation', errors }));
    const err = await apiService.auth.login('', 'x').catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 400, fields: errors });
  });

  it("s'inscrit sur /auth/register puis ouvre la session avec le code reçu par e-mail", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...OK, token: null }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(OK), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiService.signup.start({ ...USER, phone: '074 12 34 56', password: 'secret123' });
    const session = await apiService.signup.verify('074123456', '123456');
    expect(fetchMock.mock.calls[0][0]).toBe(API_BASE_URL + '/auth/register');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ phone: '074123456', password: 'secret123' });
    expect(fetchMock.mock.calls[1][0]).toBe(API_BASE_URL + '/auth/verify-otp');
    expect(session.token).toBe('jwt-abc');
  });
});

describe('apiService — événements, villes et organisateurs (event-service)', () => {
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
    const ev = await apiService.events.get('u-jazz');
    expect(ev).toMatchObject({
      id: 'u-jazz', numericId: 7, category: 'Concert', city: 'Libreville', image: '/images/ticketHome.png',
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
    await expect(apiService.events.get('u-jazz')).rejects.toMatchObject({ status: 404 });
  });

  it('charge toutes les pages du catalogue', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(page([API_EVENT], 0, 2))
      .mockResolvedValueOnce(page([{ ...API_EVENT, uuid: 'u-2' }], 1, 2));
    vi.stubGlobal('fetch', fetchMock);
    const list = await apiService.events.list();
    expect(list.map((e) => e.id)).toEqual(['u-jazz', 'u-2']);
    expect(fetchMock.mock.calls[0][0]).toBe(API_BASE_URL + '/events/all?sortBy=startDate&sortDirection=asc&page=0&size=100');
    expect(fetchMock.mock.calls[1][0]).toContain('page=1');
  });

  it('convertit les villes actives', async () => {
    vi.stubGlobal('fetch', respond(200, [{ id: 1, uuid: 'v1', name: 'Libreville', country: 'Gabon', countryCode: 'GA', eventCount: 99 }]));
    await expect(apiService.cities.list()).resolves.toEqual([{ id: '1', name: 'Libreville', region: 'Gabon' }]);
  });

  it("lit l'annuaire public des organisateurs", async () => {
    const fetchMock = respond(200, [{ id: 3, uuid: 's3', name: 'IFG', type: 'Culture', city: 'Libreville', venue: 'Bord de mer', description: null, logoUrl: null, upcomingEventCount: 2 }]);
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiService.organizers.list()).resolves.toEqual([
      { id: '3', name: 'IFG', type: 'Culture', city: 'Libreville', venue: 'Bord de mer', description: '', logo: undefined, upcomingCount: 2 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(API_BASE_URL + '/events/structures/public');
  });
});

describe('apiService — vérification du code reçu par e-mail', () => {
  it.each([
    [401, { message: 'Code incorrect (2 tentative(s) restante(s))' }, 'invalid'],
    [401, { message: 'Code expiré, demandez-en un nouveau' }, 'expired'],
    [401, { message: 'Nombre maximum de tentatives atteint' }, 'too_many'],
    [429, { message: 'Attendez avant de redemander un code' }, 'too_many'],
  ])('HTTP %i %j → OtpError « %s »', async (status, body, code) => {
    vi.stubGlobal('fetch', respond(status, body));
    const err = await apiService.signup.verify('074123456', '123456').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OtpError);
    expect((err as OtpError).code).toBe(code);
    expect((err as OtpError).serverMessage).toBe(body.message);
  });

  it('laisse passer les autres erreurs', async () => {
    vi.stubGlobal('fetch', respond(500, { error: 'boom' }));
    await expect(apiService.signup.verify('074123456', '123456')).rejects.toBeInstanceOf(ApiError);
  });
});
