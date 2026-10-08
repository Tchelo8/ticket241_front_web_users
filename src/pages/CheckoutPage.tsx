import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, Trash, User, WarningCircle } from '@phosphor-icons/react';
import { useEvent } from '../api/hooks';
import { apiService } from '../api/apiService';
import { DoubleRule } from '../components/DoubleRule';
import { PaymentMethodCard } from '../components/PaymentMethodCard';
import { PayButton, type PayButtonState } from '../components/PayButton';
import { QtyStepper } from '../components/QtyStepper';
import { TextField } from '../components/TextField';
import { useAuth, fullName } from '../store/auth';
import { cartCount, useCart } from '../store/cart';
import { METHODS, useCheckout } from '../store/checkout';
import { DISCOUNT, SERVICE_FEE, discount, subtotal, ticketPrice } from '../lib/events';
import { fcfa, formatLongDate, formatTime, phoneDigits } from '../lib/format';
import { cx } from '../lib/cx';
import type { PaymentMethod } from '../types';
import s from './CheckoutPage.module.css';

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuth((st) => st.user);
  const { cart, bump, removeLine } = useCart();
  const { buyer, setBuyer, method, setMethod, payment, setPayment } = useCheckout();
  const { data: ev } = useEvent(cart?.eventId);
  const [terms, setTerms] = useState(false);

  // Coordonnées préremplies depuis le profil.
  useEffect(() => {
    if (user && !buyer.name && !buyer.phone) setBuyer({ name: fullName(user), phone: user.phone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Un paiement « busy » orphelin (retour arrière) redevient disponible.
  useEffect(() => {
    if (payment.stage === 'busy' || payment.stage === 'waiting') setPayment({ stage: 'idle' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = cartCount(cart);
  const sub = ev && cart ? subtotal(ev, cart) : 0;
  const disc = discount(sub);
  const total = sub - disc + SERVICE_FEE;
  const nameOk = buyer.name.trim().length > 2;
  const phoneOk = phoneDigits(buyer.phone).length >= 8;
  const canPay = count > 0 && terms && nameOk && phoneOk && !METHODS[method].disabled;
  const busy = payment.stage === 'busy';
  const mi = METHODS[method];
  const state: PayButtonState = busy ? 'loading' : canPay ? 'idle' : 'disabled';

  const pay = async () => {
    if (!canPay || !cart || busy) return;
    setPayment({ stage: 'busy', error: undefined });
    try {
      const intent = await apiService.payments.create({
        eventId: cart.eventId, std: cart.std, vip: cart.vip, method, name: buyer.name.trim(), phone: buyer.phone.trim(), amount: total,
      });
      setPayment({
        stage: 'waiting', txId: intent.txId, expiresAt: intent.expiresAt, amount: total,
        phone: buyer.phone.trim(), eventId: cart.eventId, count,
      });
      navigate('/paiement/attente');
    } catch {
      setPayment({ stage: 'failed', error: `La connexion à ${mi.name} a échoué. Vérifiez votre réseau puis réessayez.` });
    }
  };

  const lines = ev && cart
    ? (['std', 'vip'] as const).filter((k) => cart[k] > 0).map((k) => ({ k, name: ev.ticketTypes.find((t) => t.id === k)!.name, unit: ticketPrice(ev, k), qty: cart[k] }))
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
            <div className={s.fields}>
              <TextField
                label="Nom complet"
                icon={<User size={18} />}
                value={buyer.name}
                onChange={(e) => setBuyer({ name: e.target.value })}
                placeholder="Ex. Alida Nzé Mba"
                autoComplete="name"
                error={!nameOk && 'Indiquez au moins 3 caractères.'}
              />
              <TextField
                label="Numéro de téléphone"
                phone
                value={buyer.phone}
                onChange={(e) => setBuyer({ phone: e.target.value })}
                placeholder="074 12 34 56"
                error={!phoneOk && 'Le numéro doit compter au moins 8 chiffres.'}
              />
            </div>
            <div className={s.fieldsHint}>La demande de paiement sera envoyée sur ce numéro.</div>
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

          <section className={s.refund}>
            <ShieldCheck size={24} />
            <div>
              <div className={s.refundTitle}>Annulation gratuite sous 48 h</div>
              <p className={s.refundText}>
                Annulez jusqu'à 48 heures avant l'événement : remboursement intégral sur votre compte mobile money, sans pénalité.
              </p>
            </div>
          </section>
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
                <QtyStepper compact label={l.name} value={l.qty} onChange={(v) => bump(l.k, v - l.qty)} />
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
            <div className={s.priceRow}><span className={s.priceLabel}>Sous-total</span><span className={s.priceValue}>{fcfa(sub)}</span></div>
            <div className={s.priceRow}><span className={s.priceLabel}>Frais de service</span><span className={s.priceValue}>{fcfa(SERVICE_FEE)}</span></div>
            <div className={s.priceRow}>
              <span className={s.priceLabel}>Réduction · {DISCOUNT.code}</span>
              <span className={cx(s.priceValue, s.discount)}>− {fcfa(disc)}</span>
            </div>
            <div className={s.totalRule} />
            <div className={s.total}>
              <span className={s.totalLabel}>Total</span>
              <span className={s.totalValue}>{fcfa(total)}</span>
            </div>
            <label className={s.terms}>
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span className={s.box} aria-hidden><Check size={12} weight="bold" /></span>
              <span>J'accepte les conditions de vente et confirme mon achat.</span>
            </label>
            <div className={s.pay}>
              <PayButton state={state} amountLabel={fcfa(total)} providerName={mi.name} onClick={pay} describedBy="pay-hint" />
            </div>
            <div className={s.payHint} id="pay-hint">
              {canPay || busy
                ? `Une demande sera envoyée sur votre téléphone ${mi.name}`
                : 'Complétez vos coordonnées et acceptez les conditions'}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
