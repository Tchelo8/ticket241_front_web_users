import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DeviceMobile } from '@phosphor-icons/react';
import { useOrder } from '../api/hooks';
import { UssdWaiting } from '../components/UssdWaiting';
import { useCart } from '../store/cart';
import { METHODS, useCheckout } from '../store/checkout';
import { fcfa, formatCountdown } from '../lib/format';
import type { Ticket } from '../types';
import s from './WaitingPage.module.css';

const secondsLeft = (iso?: string) => (iso ? Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)) : 0);

export type OrderOutcome = 'paid' | 'failed' | 'expired' | 'pending';

/** Où en est le paiement d'une commande, d'après ses billets. */
export const orderOutcome = (tickets: Ticket[] | undefined): OrderOutcome => {
  if (!tickets?.length) return 'pending';
  if (tickets.every((t) => t.status === 'PAID' || t.status === 'USED')) return 'paid';
  if (tickets.some((t) => t.paymentStatus === 'FAILED')) return 'failed';
  if (tickets.some((t) => t.status === 'EXPIRED' || t.status === 'CANCELLED')) return 'expired';
  return 'pending';
};

export function WaitingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { method, payment, setPayment, resetPayment } = useCheckout();
  const clearCart = useCart((st) => st.clear);
  const mi = METHODS[method];
  const order = payment.orderId ? { orderId: payment.orderId, guestToken: payment.guestToken } : undefined;
  const { data: tickets } = useOrder(order, payment.stage === 'waiting');
  const outcome = orderOutcome(tickets);
  // Échéance du paiement : la plus proche des billets de la commande
  const deadline = useMemo(
    () => tickets?.map((t) => t.expiresAt).filter(Boolean).sort()[0],
    [tickets],
  );
  const [left, setLeft] = useState(() => secondsLeft(deadline));

  useEffect(() => {
    setLeft(secondsLeft(deadline));
    const t = setInterval(() => setLeft(secondsLeft(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  // Bascule selon l'état de la commande, relue toutes les 3 s.
  useEffect(() => {
    if (outcome === 'paid') {
      setPayment({ stage: 'done' });
      clearCart();
      qc.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/paiement/confirme', { replace: true });
    } else if (outcome === 'failed') {
      resetPayment(`Le paiement ${mi.name} a été refusé. Aucun montant n'a été débité.`);
      navigate('/paiement', { replace: true });
    } else if (outcome === 'expired') {
      resetPayment('La demande a expiré sans confirmation et les places ont été libérées. Vous pouvez recommencer.');
      navigate('/paiement', { replace: true });
    }
  }, [outcome, mi.name, navigate, qc, clearCart, setPayment, resetPayment]);

  if (!payment.orderId) return <Navigate to="/paiement" replace />;

  // Pas d'annulation côté serveur pour une demande en cours : sans validation, elle expire
  // à l'échéance et les places sont libérées automatiquement
  const leave = () => {
    resetPayment();
    navigate('/paiement', { replace: true });
  };

  return (
    <main className={s.main}>
      <UssdWaiting tint={mi.tint} logo={mi.logo} />
      <div className={s.provider} style={{ color: mi.tint }}>{mi.name}</div>
      <h1 className={s.title}>Demande envoyée</h1>
      <p className={s.lead}>
        Une demande de paiement de <b>{fcfa(payment.amount ?? 0)}</b> vient d'être envoyée {payment.phone ? <>au <b>+241 {payment.phone}</b></> : 'au numéro de la commande'}.
      </p>
      <div className={s.box}>
        <DeviceMobile size={22} />
        <div>
          Validez sur votre téléphone en saisissant votre code secret. Sans notification, composez <b>{mi.code}</b> puis suivez le menu.
        </div>
      </div>
      <div className={s.status} role="status" aria-live="off">
        <span className={s.dot} style={{ background: mi.tint }} aria-hidden />
        En attente de confirmation{deadline ? ` · ${formatCountdown(left)}` : ''}
      </div>
      <div className={s.track} aria-hidden>
        <div className={s.sweep} style={{ background: mi.tint }} />
      </div>
      <div className={s.actions}>
        <button type="button" className={s.cancel} onClick={leave}>Abandonner</button>
      </div>
      <p className={s.lead} style={{ fontSize: 13 }}>
        Sans validation avant la fin du décompte, la demande expire et vos places sont libérées.
      </p>
    </main>
  );
}
