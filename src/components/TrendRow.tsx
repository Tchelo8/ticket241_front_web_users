import { Link } from 'react-router-dom';
import type { Event } from '../types';
import { fcfaShort, formatShortDate } from '../lib/format';
import s from './TrendRow.module.css';

/** Ligne classée : rang, vignette, titre, tendance · date, prix. */
export function TrendRow({ event, rank, trend }: { event: Event; rank: number; trend: string }) {
  return (
    <div className={s.row}>
      <div className={s.rank} aria-hidden>{rank}</div>
      <img src={event.image} alt="" className={`${s.thumb} evimg`} />
      <div className={s.body}>
        <h3 className={s.name}>
          <Link to={`/evenements/${event.id}`} className={s.link}>
            <span className="sr-only">N° {rank} : </span>{event.name}
          </Link>
        </h3>
        <div className={s.meta}>
          <span className={s.trend}>{trend}</span> · {formatShortDate(event.startsAt)}
        </div>
      </div>
      <div className={s.price}>{fcfaShort(event.priceFrom)}</div>
    </div>
  );
}
