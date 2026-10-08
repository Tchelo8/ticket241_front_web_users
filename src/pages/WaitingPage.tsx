import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DeviceMobile } from '@phosphor-icons/react';
import { apiService } from '../api/apiService';
import { usePaymentStatus } from '../api/hooks';
import { UssdWaiting } from '../components/UssdWaiting';
import { useCart } from '../store/cart';
import { METHODS, useCheckout } from '../store/checkout';
import { fcfa, formatCountdown } from '../lib/format';
import s from './WaitingPage.module.css';

/** Délai avant de pouvoir renvoyer la demande (à caler sur l'API). */
const RESEND_AFTER_S = 30;

const secondsLeft = (iso?: string) => (iso ? Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)) : 0);

export function WaitingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { method, payment, setPayment, resetPayment } = useCheckout();
  const clearCart = useCart((st) => st.clear);
  const mi = METHODS[method];
  const { data } = usePaymentStatus(payment.txId);
  const [left, setLeft] = useState(() => secondsLeft(payment.expiresAt));
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [resending, setResending] = useState(false);

  // Décompte depuis l'échéance renvoyée par l'API (87 s).
  useEffect(() => {
    const t = setInterval(() => {
      setLeft(secondsLeft(payment.expiresAt));
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, [payment.expiresAt]);

  // Bascule selon le statut interrogé toutes les 3 s.
  useEffect(() => {
    if (!data) return;
    if (data.status === 'success') {
      setPayment({ stage: 'done', ticketRef: data.ticketRef });
      clearCart();
      qc.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/paiement/confirme', { replace: true });
    } else if (data.status === 'failed') {
      resetPayment(`Le paiement ${mi.name} a été refusé. Aucun montant n'a été débité.`);
      navigate('/paiement', { replace: true });
    } else if (data.status === 'expired') {
      resetPayment('La demande a expiré sans confirmation. Vous pouvez relancer le paiement.');
      navigate('/paiement', { replace: true });
    }
  }, [data, mi.name, navigate, qc, clearCart, setPayment, resetPayment]);

  if (!payment.txId) return <Navigate to="/paiement" replace />;

  const resendIn = Math.max(0, RESEND_AFTER_S - Math.floor((now - sentAt) / 1000));

  const resend = async () => {
    if (resendIn > 0 || resending || !payment.txId) return;
    setResending(true);
    try {
      const intent = await apiService.payments.resend(payment.txId);
      setPayment({ expiresAt: intent.expiresAt });
      setSentAt(Date.now());
      setLeft(secondsLeft(intent.expiresAt));
    } finally {
      setResending(false);
    }
  };

  const cancel = async () => {
    if (payment.txId) await apiService.payments.cancel(payment.txId);
    resetPayment();
    navigate('/paiement', { replace: true });
  };

  return (
    <main className={s.main}>
      <UssdWaiting tint={mi.tint} logo={mi.logo} />
      <div className={s.provider} style={{ color: mi.tint }}>{mi.name}</div>
      <h1 className={s.title}>Demande envoyée</h1>
      <p className={s.lead}>
        Une notification de paiement de <b>{fcfa(payment.amount ?? 0)}</b> vient d'être envoyée au <b>+241 {payment.phone}</b>.
      </p>
      <div className={s.box}>
        <DeviceMobile size={22} />
        <div>
          Validez sur votre téléphone en saisissant votre code secret. Sans notification, composez <b>{mi.code}</b> puis suivez le menu.
        </div>
      </div>
      <div className={s.status} role="status" aria-live="off">
        <span className={s.dot} style={{ background: mi.tint }} aria-hidden />
        En attente de confirmation · {formatCountdown(left)}
      </div>
      <div className={s.track} aria-hidden>
        <div className={s.sweep} style={{ background: mi.tint }} />
      </div>
      <div className={s.actions}>
        <button type="button" className={`btn btn--outline ${s.resend}`} disabled={resendIn > 0 || resending} onClick={resend}>
          {resendIn > 0 ? `Renvoyer la demande · ${resendIn} s` : 'Renvoyer la demande'}
        </button>
        <button type="button" className={s.cancel} onClick={cancel}>Annuler le paiement</button>
      </div>
    </main>
  );
}
