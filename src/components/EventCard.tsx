import { MapPin } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { formatShortDate, formatTime, fromPrice } from '../lib/format';
import { isPast } from '../lib/events';
import { cx } from '../lib/cx';
import { FavButton } from './FavButton';
import s from './EventCard.module.css';

/** Carte de grille : image 4:3, date · heure, titre, lieu, filet, prix. */
export function EventCard({ event, animate }: { event: Event; animate?: boolean }) {
  const past = isPast(event);
  return (
    <article className={cx(s.card, animate && s.rise)}>
      <div className={s.media}>
        <img src={event.image} alt="" className="evimg" loading="lazy" />
        {past && (
          <div className={s.veil}>
            <span className={s.past}>Passé</span>
          </div>
        )}
        <FavButton eventId={event.id} name={event.name} />
      </div>
      <div className={s.body}>
        <div className={s.date}>
          {formatShortDate(event.startsAt)} · {formatTime(event.startsAt)}
        </div>
        <h3 className={s.title}>
          <Link to={`/evenements/${event.id}`} className={s.link}>{event.name}</Link>
        </h3>
        <div className={s.venue}>
          <MapPin size={14} style={{ flex: 'none' }} />
          <span>{event.venue}, {event.city}</span>
        </div>
        <div className={s.rule} />
        <div className={s.price}>{fromPrice(event.priceFrom)}</div>
      </div>
    </article>
  );
}
