import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Copy, DownloadSimple } from '@phosphor-icons/react';
import { useEvent, useOrder } from '../api/hooks';
import { apiService, saveFile } from '../api/apiService';
import { CornerMarks } from '../components/CornerMarks';
import { LottiePlayer } from '../components/LottiePlayer';
import { METHODS, useCheckout } from '../store/checkout';
import { guestOrderLink } from '../store/guestOrders';
import { fcfa, formatLongDate, plural } from '../lib/format';
import successAnim from '../assets/lottie/Success.json';
import s from './SuccessPage.module.css';

export function SuccessPage() {
  const { method, payment } = useCheckout();
  const { data: ev } = useEvent(payment.eventId);
  const order = payment.orderId ? { orderId: payment.orderId, guestToken: payment.guestToken } : undefined;
  const { data: tickets = [] } = useOrder(order);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  if (payment.stage !== 'done' || !order) return <Navigate to="/billets" replace />;
  const mi = METHODS[method];
  const link = order.guestToken ? guestOrderLink(order.orderId, order.guestToken) : null;

  const download = async () => {
    setDownloading(true);
    try {
      saveFile(await apiService.orders.downloadPdf(order), `billets-ticket241-${order.orderId.slice(0, 8)}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };

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
        {fcfa(payment.amount ?? 0)} débités via {mi.name}.
        {tickets[0] && ' Si vous avez donné votre e-mail, vos billets vous y sont aussi envoyés en PDF.'}
      </p>
      {ev && (
        <div className={s.ticket}>
          <div className={s.ticketTop}>
            <img src={ev.image} alt="" className="evimg" />
            <div style={{ minWidth: 0 }}>
              <div className={s.kicker}>Billets émis</div>
              <div className={s.name}>{ev.name}</div>
              <div className={s.meta}>{formatLongDate(ev.startsAt)} · {plural(tickets.length || payment.count || 0, 'billet')}</div>
            </div>
          </div>
          <div className={s.ticketBottom}>
            <span className={s.ref}>{tickets.map((t) => t.number).join(' · ')}</span>
            <button type="button" className={`link-btn ${s.qr}`} onClick={download} disabled={downloading}>
              <DownloadSimple size={16} /> {downloading ? 'Téléchargement…' : 'Télécharger le PDF'}
            </button>
          </div>
        </div>
      )}
      {link && (
        <p className={s.lead}>
          <b>Gardez le lien de votre commande</b> : il donne accès à vos billets sans compte.{' '}
          <button type="button" className="link-btn" onClick={copy}>
            <Copy size={15} /> {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </p>
      )}
      <div className={s.actions}>
        {link ? (
          <Link to={`/commande/${encodeURIComponent(order.orderId)}#${order.guestToken}`} className="btn btn--primary">Voir mes billets</Link>
        ) : (
          <Link to="/billets" className="btn btn--primary">Voir mes billets</Link>
        )}
        <Link to="/" className="btn btn--outline">Retour à l'accueil</Link>
      </div>
    </main>
  );
}
