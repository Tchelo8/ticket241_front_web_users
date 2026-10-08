import { QrCode, Star } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Event, Ticket } from '../types';
import { formatShortDate, formatTime, plural } from '../lib/format';
import { daysUntil } from '../lib/clock';
import { cx } from '../lib/cx';
import s from './TicketCard.module.css';

/** Billet avec séparateur pointillé ; `upcoming` ou `past`. */
export function TicketCard({ ticket, event, variant }: { ticket: Ticket; event: Event; variant: 'upcoming' | 'past' }) {
  const up = variant === 'upcoming';
  const d = daysUntil(event.startsAt);
  const countdown = up ? (d <= 0 ? "Aujourd'hui" : `J-${d}`) : 'Terminé';
  return (
    <article className={cx(s.card, !up && s.past)}>
      <div className={s.main}>
        <img src={event.image} alt="" className={`${s.thumb} evimg`} />
        <div className={s.info}>
          <span className={s.badge}>{up ? 'Payé' : 'Utilisé'}</span>
          <h2 className={s.name}>{event.name}</h2>
          <div className={s.when}>
            {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)} · {event.venue}
          </div>
        </div>
      </div>
      <div className={s.stub}>
        <div className={s.pills}>
          <span className={s.pill}>{plural(ticket.quantity, 'billet')}</span>
          <span className={s.pill}>{countdown}</span>
          <span className={s.ref}>{ticket.ref}</span>
        </div>
        {up ? (
          <Link to={`/billets/${ticket.ref}`} className={s.action}>
            <QrCode size={17} />Voir le QR
          </Link>
        ) : (
          <button type="button" className={s.action}>
            <Star size={17} />Laisser un avis
          </button>
        )}
      </div>
    </article>
  );
}
