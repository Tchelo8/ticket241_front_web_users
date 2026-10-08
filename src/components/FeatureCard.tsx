import { Clock, MapPin } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { fcfaShort, formatDay, formatMonthShort, formatShortDate, formatTime, fromPrice } from '../lib/format';
import { cx } from '../lib/cx';
import s from './FeatureCard.module.css';

/** Grande affiche avec dégradé et bloc date (`size="lg"`), ou affiche secondaire (`size="sm"`). */
export function FeatureCard({ event, size = 'lg', badge }: { event: Event; size?: 'lg' | 'sm'; badge?: string }) {
  const link = (
    <Link to={`/evenements/${event.id}`} className={s.link}>
      {event.name}
    </Link>
  );
  return (
    <article className={cx(s.card, s[size])}>
      <img src={event.image} alt="" className="evimg" />
      <div className={s.shade} />
      {size === 'lg' ? (
        <>
          {badge && <span className={s.badge}>{badge}</span>}
          <div className={s.dateBlock} aria-hidden>
            <div className={s.day}>{formatDay(event.startsAt)}</div>
            <div className={s.mon}>{formatMonthShort(event.startsAt)}</div>
          </div>
          <div className={s.content}>
            <div className={s.kicker}>{event.category} · {event.city}</div>
            <h3 className={s.title}>{link}</h3>
            <div className={s.meta}>
              <span><MapPin size={16} />{event.venue}</span>
              <span><Clock size={16} />{formatTime(event.startsAt)}</span>
              <span className={s.price}>{fromPrice(event.priceFrom)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className={s.content}>
          <div className={s.kicker}>{formatShortDate(event.startsAt)}</div>
          <h3 className={s.title}>{link}</h3>
          <div className={s.smMeta}>{event.venue} · {fcfaShort(event.priceFrom)}</div>
        </div>
      )}
    </article>
  );
}
