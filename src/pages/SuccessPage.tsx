import { Link, Navigate } from 'react-router-dom';
import { useEvent } from '../api/hooks';
import { CornerMarks } from '../components/CornerMarks';
import { LottiePlayer } from '../components/LottiePlayer';
import { METHODS, useCheckout } from '../store/checkout';
import { fcfa, formatLongDate, plural } from '../lib/format';
import successAnim from '../assets/lottie/Success.json';
import s from './SuccessPage.module.css';

export function SuccessPage() {
  const { method, payment } = useCheckout();
  const { data: ev } = useEvent(payment.eventId);
  if (payment.stage !== 'done' || !payment.ticketRef) return <Navigate to="/billets" replace />;
  const mi = METHODS[method];

  return (
    <main className={s.main}>
      <div className={s.frame}>
        <CornerMarks corners={['tl', 'br']} />
        <span className={s.seal}>
          <LottiePlayer data={successAnim} size={120} loop={false} />
        </span>
        <div className={s.caption}>Transaction validée</div>
      </div>
      <h1 className={s.title}>Paiement confirmé</h1>
      <p className={s.lead}>
        {fcfa(payment.amount ?? 0)} débités via {mi.name}. Un SMS et un e-mail de confirmation arrivent dans un instant.
      </p>
      {ev && (
        <div className={s.ticket}>
          <div className={s.ticketTop}>
            <img src={ev.image} alt="" className="evimg" />
            <div style={{ minWidth: 0 }}>
              <div className={s.kicker}>Billet émis</div>
              <div className={s.name}>{ev.name}</div>
              <div className={s.meta}>{formatLongDate(ev.startsAt)} · {plural(payment.count ?? 0, 'billet')}</div>
            </div>
          </div>
          <div className={s.ticketBottom}>
            <span className={s.ref}>{payment.ticketRef}</span>
            <Link to={`/billets/${payment.ticketRef}`} className={`link-btn ${s.qr}`}>Voir le QR code</Link>
          </div>
        </div>
      )}
      <div className={s.actions}>
        <Link to="/billets" className="btn btn--primary">Voir mes billets</Link>
        <Link to="/" className="btn btn--outline">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
