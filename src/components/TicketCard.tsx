import { QrCode } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Event, Ticket } from '../types';
import { formatShortDate, formatTime } from '../lib/format';
import { daysUntil } from '../lib/clock';
import { cx } from '../lib/cx';
import { FALLBACK_IMAGE } from '../api/eventAdapter';
import { ticketStatusLabel } from './TicketPass';
import s from './TicketCard.module.css';

/** Billet avec séparateur pointillé ; `upcoming` ou `past`. L'événement (affiche) est facultatif. */
export function TicketCard({ ticket, event, variant }: { ticket: Ticket; event?: Event; variant: 'upcoming' | 'past' }) {
  const up = variant === 'upcoming';
  const d = daysUntil(ticket.startsAt);
  const countdown = up ? (d <= 0 ? "Aujourd'hui" : `J-${d}`) : 'Terminé';
  return (
    <article className={cx(s.card, !up && s.past)}>
      <div className={s.main}>
        <img src={event?.image ?? FALLBACK_IMAGE} alt="" className={`${s.thumb} evimg`} />
        <div className={s.info}>
          <span className={s.badge}>{ticketStatusLabel(ticket)}</span>
          <h2 className={s.name}>{ticket.eventName}</h2>
          <div className={s.when}>
            {formatShortDate(ticket.startsAt)} · {formatTime(ticket.startsAt)} · {ticket.venue}
          </div>
        </div>
      </div>
      <div className={s.stub}>
        <div className={s.pills}>
          <span className={s.pill}>{ticket.typeName}</span>
          <span className={s.pill}>{countdown}</span>
          <span className={s.ref}>{ticket.number}</span>
        </div>
        <Link to={`/billets/${ticket.ref}`} className={s.action}>
          <QrCode size={17} />{up ? 'Voir le QR' : 'Voir le billet'}
        </Link>
      </div>
    </article>
  );
}
