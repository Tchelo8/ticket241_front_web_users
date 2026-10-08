import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, DownloadSimple, MapTrifold, ShieldCheck } from '@phosphor-icons/react';
import { useEvent, useTicket } from '../api/hooks';
import { fcfaShort, formatLongDate, formatTime } from '../lib/format';
import { mapsUrl } from './EventPage';
import { NotFoundPage } from './NotFoundPage';
import { Loading } from './Loading';
import s from './TicketPage.module.css';

export function TicketPage() {
  const { ref } = useParams();
  const { data: t, isLoading, isError } = useTicket(ref);
  const { data: ev } = useEvent(t?.eventId);

  if (isLoading || (t && !ev)) return <Loading />;
  if (isError || !t || !ev) return <NotFoundPage />;

  return (
    <main className="container container--sm">
      <Link to="/billets" className={`back-link ${s.back}`}><ArrowLeft size={17} />Mes billets</Link>
      <article className={s.card}>
        <div className={s.left}>
          <div className={s.kicker}>Ticket241 · Entrée</div>
          <h1 className={s.title}>{ev.name}</h1>
          <div className={s.when}>{formatLongDate(ev.startsAt)} · {formatTime(ev.startsAt)} · {ev.venue}</div>
          <div className={s.grid}>
            <div className={s.cell}><div className={s.cellLabel}>Type</div><div className={s.cellValue}>{t.typeName}</div></div>
            <div className={s.cell}><div className={s.cellLabel}>Places</div><div className={s.cellValue}>{t.quantity}</div></div>
            <div className={s.cell}><div className={s.cellLabel}>Payé</div><div className={s.cellValue}>{fcfaShort(t.paid)}</div></div>
          </div>
          <div className={s.actions}>
            {/* Le PDF sera fourni par l'API ; en attendant, impression du billet (« Enregistrer en PDF »). */}
            <button type="button" className="btn btn--primary" onClick={() => window.print()}>
              <DownloadSimple size={18} />Télécharger le PDF
            </button>
            <a className="btn btn--outline" href={mapsUrl(`${ev.venue}, ${ev.address}, ${ev.city}, Gabon`)} target="_blank" rel="noreferrer">
              <MapTrifold size={18} />Itinéraire
            </a>
          </div>
        </div>
        <div className={s.right}>
          <div className={s.qr}>
            <QRCodeSVG value={t.ref} size={175} level="M" bgColor="#ffffff" fgColor="#141312" title={`QR code du billet ${t.ref}`} />
          </div>
          <div className={s.ref}>{t.ref}</div>
          <div className={s.hint}>Présentez ce code à l'entrée</div>
        </div>
      </article>
      <div className={s.note}>
        <ShieldCheck size={22} />
        <div>
          <div className={s.noteTitle}>Annulation gratuite sous 48 h</div>
          <div className={s.noteText}>Remboursement intégral sur le même compte mobile money.</div>
        </div>
      </div>
    </main>
  );
}
