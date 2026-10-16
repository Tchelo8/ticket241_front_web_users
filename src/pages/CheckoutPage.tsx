import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, EnvelopeSimple, Info, Trash, User, WarningCircle } from '@phosphor-icons/react';
import { useEvent } from '../api/hooks';
import { ApiError, apiService, type OrderAccess } from '../api/apiService';
import { DoubleRule } from '../components/DoubleRule';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { PayButton, type PayButtonState } from '../components/PayButton';
import { QtyStepper } from '../components/QtyStepper';
import { TextField } from '../components/TextField';
import { useAuth, fullName } from '../store/auth';
import { cartCount, useCart } from '../store/cart';
import { METHODS, useCheckout } from '../store/checkout';
import { useGuestOrders } from '../store/guestOrders';
import { subtotal, ticketPrice } from '../lib/events';
import { fcfa, formatLongDate, formatTime, phoneDigits } from '../lib/format';
import { cx } from '../lib/cx';
import type { PaymentMethod, Ticket } from '../types';
import s from './CheckoutPage.module.css';

/** Sans compte : 5 billets au plus par commande (toutes catégories confondues). */
export const GUEST_MAX_TICKETS = 5;

/** Délai d'attente de la confirmation des places par l'event-service. */
const RESERVE_POLL_MS = 1500;
const RESERVE_MAX_TRIES = 40;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Les places sont confirmées de façon asynchrone (Kafka) : on relit la commande jusqu'à ce
 * qu'aucun billet ne soit plus « en cours » (PENDING).
 */
export async function waitForReservedSeats(order: OrderAccess): Promise<Ticket[]> {
  for (let i = 0; i < RESERVE_MAX_TRIES; i++) {
    const tickets = await apiService.orders.get(order);
    if (tickets.length && tickets.every((t) => t.status !== 'PENDING')) return tickets;
    await sleep(RESERVE_POLL_MS);
  }
  throw new Error('timeout');
}

/** Message affichable pour une erreur de réservation ou de paiement. */
export const checkoutErrorMessage = (err: unknown, provider: string): string => {
  if (err instanceof ApiError) {
    if (err.fields) return Object.values(err.fields)[0] ?? 'Vérifiez les informations saisies.';
    if (err.status === 401) return 'Votre session a expiré : reconnectez-vous puis réessayez.';
    if (err.serverMessage && err.status < 500) return err.serverMessage;
    return 'Le service est momentanément indisponible. Réessayez dans quelques instants.';
  }
  if (err instanceof Error && err.message === 'timeout')
    return 'La confirmation des places prend plus de temps que prévu. Réessayez dans quelques instants.';
  return `La connexion à ${provider} a échoué. Vérifiez votre réseau puis réessayez.`;
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuth((st) => st.user);
  const { cart, bump, removeLine } = useCart();
  const { buyer, setBuyer, method, setMethod, payment, setPayment } = useCheckout();
  const addGuestOrder = useGuestOrders((st) => st.add);
  const { data: ev } = useEvent(cart?.eventId);
  const [terms, setTerms] = useState(false);
  const [step, setStep] = useState('');

  // Coordonnées préremplies depuis le profil.
  useEffect(() => {
    if (user && !buyer.name && !buyer.phone) setBuyer({ name: fullName(user), phone: user.phone, email: user.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Un paiement « busy » orphelin (retour arrière) redevient disponible.
  useEffect(() => {
    if (payment.stage === 'busy' || payment.stage === 'waiting') setPayment({ stage: 'idle' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guest = !user;
  const count = cartCount(cart);
  const sub = ev && cart ? subtotal(ev, cart.lines) : 0;
  const nameOk = buyer.name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const phoneOk = phoneDigits(buyer.phone).length >= 8;
  const emailOk = !buyer.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim());
  const tooMany = guest && count > GUEST_MAX_TICKETS;
  const canPay = count > 0 && !tooMany && terms && nameOk && phoneOk && emailOk && !METHODS[method].disabled && !!ev;
  const busy = payment.stage === 'busy';
  const mi = METHODS[method];
  const state: PayButtonState = busy ? 'loading' : canPay ? 'idle' : 'disabled';

  const pay = async () => {
    if (!canPay || !cart || !ev || busy) return;
    setPayment({ stage: 'busy', error: undefined });
    const [firstName, ...rest] = buyer.name.trim().split(/\s+/);
    try {
      setStep('Réservation de vos places…');
      const reservation = await apiService.orders.reserve(
        {
          eventId: ev.numericId,
          items: Object.entries(cart.lines)
            .filter(([, q]) => q > 0)
            .map(([id, quantity]) => ({ ticketCategoryId: Number(id), quantity })),
          firstName,
          lastName: rest.join(' '),
          phone: buyer.phone,
          email: buyer.email.trim() || undefined,
        },
        guest,
      );
      const order: OrderAccess = { orderId: reservation.orderId, guestToken: reservation.guestToken };
      // Sans compte, le jeton est la seule clé des billets : on le garde sur cet appareil
      if (reservation.guestToken) {
        addGuestOrder({ orderId: reservation.orderId, token: reservation.guestToken, eventName: ev.name, createdAt: new Date().toISOString() });
      }

      const tickets = await waitForReservedSeats(order);
      if (tickets.some((t) => t.status !== 'RESERVED')) {
        setStep('');
        setPayment({ stage: 'failed', error: 'Ces places ne sont plus disponibles. Modifiez votre sélection puis réessayez.' });
        return;
      }

      setStep(`Envoi de la demande ${mi.name}…`);
      await apiService.orders.pay(order, method, buyer.phone);
      setPayment({
        stage: 'waiting', orderId: order.orderId, guestToken: order.guestToken,
        amount: reservation.total, phone: buyer.phone.trim(), eventId: cart.eventId, count,
      });
      navigate('/paiement/attente');
    } catch (err) {
      setPayment({ stage: 'failed', error: checkoutErrorMessage(err, mi.name) });
    } finally {
      setStep('');
    }
  };

  const lines = ev && cart
    ? ev.ticketTypes
        .filter((t) => (cart.lines[t.id] ?? 0) > 0)
        .map((t) => ({ k: t.id, name: t.name, unit: ticketPrice(ev, t.id), qty: cart.lines[t.id], max: Math.min(t.maxPerOrder ?? 10, t.available ?? Infinity) }))
    : [];

  return (
    <main className="container container--md">
      <Link to={cart ? `/evenements/${cart.eventId}` : '/explorer'} className="back-link">
        <ArrowLeft size={17} />Retour à l'événement
      </Link>
      <div className={s.head}>
        <h1 className="screen-title">Paiement</h1>
        <div className={s.steps}>
          Étape 2 sur 3
          <span className={s.bars} aria-hidden>
            <span className={cx(s.bar, s.barOn)} />
            <span className={cx(s.bar, s.barOn)} />
            <span className={s.bar} />
          </span>
        </div>
      </div>
      <DoubleRule style={{ marginTop: 16 }} />

      {payment.error && (
        <div className={s.alert} role="alert">
          <WarningCircle size={20} />
          <span>{payment.error}</span>
        </div>
      )}

      <div className={s.layout}>
        <div className={s.form}>
          <section aria-labelledby="h-contact">
            <h2 className={s.h2} id="h-contact">Informations de contact</h2>
            {guest && (
              <div className={s.fieldsHint}>
                Pas besoin de compte pour acheter.{' '}
                <Link to={`/connexion?retour=${encodeURIComponent('/paiement')}`}>Se connecter</Link> pour retrouver vos billets dans « Mes billets ».
              </div>
            )}
            <div className={s.fields}>
              <TextField
                label="Nom complet"
                icon={<User size={18} />}
                value={buyer.name}
                onChange={(e) => setBuyer({ name: e.target.value })}
                placeholder="Ex. Alida Nzé Mba"
                autoComplete="name"
                error={!nameOk && 'Indiquez votre prénom et votre nom.'}
              />
              <TextField
                label="Numéro de téléphone"
                phone
                value={buyer.phone}
                onChange={(e) => setBuyer({ phone: e.target.value })}
                placeholder="074 12 34 56"
                error={!phoneOk && 'Le numéro doit compter au moins 8 chiffres.'}
              />
              <TextField
                label={guest ? 'Adresse e-mail (facultatif)' : 'Adresse e-mail'}
                type="email"
                icon={<EnvelopeSimple size={18} />}
                value={buyer.email}
                onChange={(e) => setBuyer({ email: e.target.value })}
                placeholder="vous@exemple.com"
                autoComplete="email"
                error={!emailOk && "L'adresse e-mail n'est pas valide."}
              />
            </div>
            <div className={s.fieldsHint}>
              La demande de paiement sera envoyée sur ce numéro.
              {guest && ' Avec un e-mail, vous recevez vos billets en PDF et pouvez les retrouver plus tard.'}
            </div>
          </section>

          <section aria-labelledby="h-method">
            <h2 className={s.h2} id="h-method">Moyen de paiement</h2>
            <div className={s.methods} role="radiogroup" aria-labelledby="h-method">
              {(Object.keys(METHODS) as PaymentMethod[]).map((k) => (
                <PaymentMethodCard
                  key={k}
                  {...METHODS[k]}
                  selected={method === k}
                  onSelect={() => setMethod(k)}
                />
              ))}
            </div>
          </section>

          {ev?.refundable && (
            <section className={s.refund}>
              <Info size={24} />
              <div>
                <div className={s.refundTitle}>Annulation possible</div>
                <p className={s.refundText}>
                  Cet événement accepte les annulations jusqu'à 2 jours avant la date : contactez le support avec le numéro de votre billet.
                </p>
              </div>
            </section>
          )}
        </div>

        <aside className={cx(s.summary, 'sticky-aside')} aria-label="Récapitulatif">
          {ev && (
            <div className={s.ev}>
              <img src={ev.image} alt="" className="evimg" />
              <div style={{ minWidth: 0 }}>
                <div className={s.evName}>{ev.name}</div>
                <div className={s.evDate}>{formatLongDate(ev.startsAt)} · {formatTime(ev.startsAt)}</div>
                <div className={s.evVenue}>{ev.venue}</div>
              </div>
            </div>
          )}
          <div className={s.lines}>
            {lines.map((l) => (
              <div key={l.k} className={s.line}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.lineName}>{l.name}</div>
                  <div className={s.lineUnit}>{fcfa(l.unit)}</div>
                </div>
                <QtyStepper compact label={l.name} value={l.qty} max={l.max} onChange={(v) => bump(l.k, v - l.qty)} />
                <button type="button" className={s.trash} aria-label={`Supprimer la ligne ${l.name}`} onClick={() => removeLine(l.k)}>
                  <Trash size={16} />
                </button>
              </div>
            ))}
            {count === 0 && (
              <div className={s.emptyCart}>
                Aucun billet. <Link to={cart ? `/evenements/${cart.eventId}` : '/explorer'}>En ajouter</Link>
              </div>
            )}
          </div>
          <div className={s.totals}>
            <div className={s.priceRow}><span className={s.priceLabel}>Prix des billets</span><span className={s.priceValue}>{fcfa(sub)}</span></div>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Frais de service</span>
              <span className={s.priceValue}>Calculés à la réservation</span>
            </div>
            <div className={s.totalRule} />
            <div className={s.total}>
              <span className={s.totalLabel}>Sous-total</span>
              <span className={s.totalValue}>{fcfa(sub)}</span>
            </div>
            {tooMany && (
              <div className={s.payHint} role="alert">
                Sans compte, {GUEST_MAX_TICKETS} billets au maximum par commande. Connectez-vous pour en prendre davantage.
              </div>
            )}
            <label className={s.terms}>
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span className={s.box} aria-hidden><Check size={12} weight="bold" /></span>
              <span>J'accepte les <Link to="/conditions-de-vente">conditions de vente</Link> et confirme mon achat.</span>
            </label>
            <div className={s.pay}>
              <PayButton state={state} amountLabel={fcfa(sub)} providerName={mi.name} onClick={pay} describedBy="pay-hint" />
            </div>
            <div className={s.payHint} id="pay-hint" aria-live="polite">
              {step || (canPay || busy
                ? `Le montant exact (frais compris) s'affiche sur votre téléphone ${mi.name}`
                : 'Complétez vos coordonnées et acceptez les conditions')}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
