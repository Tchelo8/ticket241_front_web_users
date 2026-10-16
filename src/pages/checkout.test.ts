import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiService } from '../api/apiService';
import type { Ticket } from '../types';
import { checkoutErrorMessage, waitForReservedSeats } from './CheckoutPage';
import { orderOutcome } from './WaitingPage';

const ticket = (over: Partial<Ticket> = {}): Ticket => ({
  ref: 't-1', number: 'TKT-1', qrCode: '', orderId: 'o-1', eventId: 'u-1', eventNumericId: 1, eventName: 'Concert',
  startsAt: '2026-12-20T20:00:00+01:00', venue: 'IFG', city: 'Libreville', typeName: 'Standard', price: 10000,
  status: 'RESERVED', ...over,
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Suivi d’une commande', () => {
  it('est payée quand tous ses billets le sont', () => {
    expect(orderOutcome([ticket({ status: 'PAID' }), ticket({ status: 'PAID' })])).toBe('paid');
    expect(orderOutcome([ticket({ status: 'PAID' }), ticket({ paymentStatus: 'PROCESSING' })])).toBe('pending');
  });

  it('échoue si le paiement est refusé, expire si les places sont libérées', () => {
    expect(orderOutcome([ticket({ paymentStatus: 'FAILED' })])).toBe('failed');
    expect(orderOutcome([ticket({ status: 'EXPIRED' })])).toBe('expired');
    expect(orderOutcome([])).toBe('pending');
  });

  it('attend que les places ne soient plus « en cours » avant de payer', async () => {
    vi.useFakeTimers();
    const get = vi.spyOn(apiService.orders, 'get')
      .mockResolvedValueOnce([ticket({ status: 'PENDING' })])
      .mockResolvedValueOnce([ticket({ status: 'RESERVED' })]);
    const done = waitForReservedSeats({ orderId: 'o-1' });
    await vi.advanceTimersByTimeAsync(1500);
    await expect(done).resolves.toEqual([ticket({ status: 'RESERVED' })]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('affiche le message du serveur pour un refus métier', () => {
    expect(checkoutErrorMessage(new ApiError(400, undefined, { message: 'Limite de 4 billet(s) par personne' }), 'Airtel Money'))
      .toBe('Limite de 4 billet(s) par personne');
    expect(checkoutErrorMessage(new ApiError(503, undefined, {}), 'Airtel Money')).toContain('indisponible');
    expect(checkoutErrorMessage(new TypeError('Failed to fetch'), 'Airtel Money')).toContain('Airtel Money');
  });
});
