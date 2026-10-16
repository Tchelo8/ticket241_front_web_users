import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DownloadSimple, MapTrifold } from '@phosphor-icons/react';
import { saveFile } from '../api/apiService';
import { fcfaShort, formatLongDate, formatTime } from '../lib/format';
import { mapsUrl } from '../pages/EventPage';
import type { Ticket } from '../types';
import s from '../pages/TicketPage.module.css';

const STATUS_LABEL: Record<Ticket['status'], string> = {
  PENDING: 'Réservation en cours',
  RESERVED: 'En attente de paiement',
  PAID: 'Payé',
  USED: 'Déjà utilisé',
  CANCELLED: 'Annulé',
  EXPIRED: 'Expiré',
  REFUNDED: 'Remboursé',
};

export const ticketStatusLabel = (t: Ticket) => STATUS_LABEL[t.status] ?? t.status;

/** Seul un billet payé (ou déjà scanné) est un vrai billet d'entrée. */
export const isValidTicket = (t: Ticket) => t.status === 'PAID' || t.status === 'USED';

/**
 * Billet d'entrée : informations, QR code (le contenu exact scanné à l'entrée) et PDF.
 * `download` charge le PDF depuis l'API (avec compte, jeton de commande ou session invité).
 */
export function TicketPass({ ticket: t, download }: { ticket: Ticket; download?: () => Promise<Blob> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = isValidTicket(t);

  const onDownload = async () => {
    if (!download) return;
    setBusy(true);
    setError('');
    try {
      saveFile(await download(), `billet-${t.number}.pdf`);
    } catch {
      setError('Le téléchargement a échoué, réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={s.card}>
      <div className={s.left}>
        <div className={s.kicker}>Ticket241 · {valid ? 'Entrée' : ticketStatusLabel(t)}</div>
        <h2 className={s.title}>{t.eventName}</h2>
        <div className={s.when}>{formatLongDate(t.startsAt)} · {formatTime(t.startsAt)} · {t.venue}</div>
        <div className={s.grid}>
          <div className={s.cell}><div className={s.cellLabel}>Catégorie</div><div className={s.cellValue}>{t.typeName}</div></div>
          <div className={s.cell}><div className={s.cellLabel}>Statut</div><div className={s.cellValue}>{ticketStatusLabel(t)}</div></div>
          <div className={s.cell}><div className={s.cellLabel}>Prix</div><div className={s.cellValue}>{fcfaShort(t.price)}</div></div>
        </div>
        <div className={s.actions}>
          {valid && download && (
            <button type="button" className="btn btn--primary" onClick={onDownload} disabled={busy}>
              <DownloadSimple size={18} />{busy ? 'Téléchargement…' : 'Télécharger le PDF'}
            </button>
          )}
          {t.venue && (
            <a className="btn btn--outline" href={mapsUrl(`${t.venue}, ${t.city}, Gabon`)} target="_blank" rel="noreferrer">
              <MapTrifold size={18} />Itinéraire
            </a>
          )}
        </div>
        {error && <div role="alert" className={s.hint}>{error}</div>}
      </div>
      <div className={s.right}>
        {valid && t.qrCode ? (
          <div className={s.qr}>
            <QRCodeSVG value={t.qrCode} size={175} level="M" bgColor="#ffffff" fgColor="#141312" title={`QR code du billet ${t.number}`} />
          </div>
        ) : null}
        <div className={s.ref}>{t.number}</div>
        <div className={s.hint}>{valid ? "Présentez ce code à l'entrée" : 'Le QR code apparaît une fois le billet payé'}</div>
      </div>
    </article>
  );
}
