import { ArrowRight, CalendarStar, MapPin, SealCheck } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE } from '../api/eventAdapter';
import { plural } from '../lib/format';
import type { Organizer } from '../types';
import s from './OrganizerCard.module.css';

export const organizerHref = (o: Organizer) => `/explorer?organisateur=${encodeURIComponent(o.id)}`;

const monogram = (o: Organizer) => o.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

/** Carte d'organisateur de l'annuaire (structures vérifiées par Ticket241). */
export function OrganizerCard({ organizer: o }: { organizer: Organizer }) {
  const place = [o.venue, o.city].filter(Boolean).join(', ');
  return (
    <article className={s.card} aria-labelledby={`org-${o.id}`}>
      <div className={s.cover}>
        <img src={o.logo ?? FALLBACK_IMAGE} alt="" className="evimg" loading="lazy" />
        <div className={s.coverShade} />
        <span className={s.kind}>{o.type}</span>
      </div>
      <div className={s.body}>
        <div className={s.head}>
          <div className={s.mono} aria-hidden>
            {o.logo ? <img src={o.logo} alt="" /> : monogram(o)}
          </div>
        </div>
        <div className={s.nameRow}>
          <h3 className={s.name} id={`org-${o.id}`}>{o.name}</h3>
          <span className={s.verified} role="img" aria-label="Organisateur vérifié" title="Organisateur vérifié">
            <SealCheck size={17} weight="fill" aria-hidden />
          </span>
        </div>
        {place && (
          <div className={s.place}>
            <MapPin size={14} aria-hidden />
            <span>{place}</span>
          </div>
        )}
        {o.description && <p className={s.desc}>{o.description}</p>}
        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.statN}>{o.upcomingCount}</div>
            <div className={s.statL}>À venir</div>
          </div>
        </div>
        <Link to={organizerHref(o)} className={s.next}>
          <CalendarStar size={18} className={s.nextIcon} aria-hidden />
          <span className={s.nextLabel}>
            {o.upcomingCount > 0 ? `Voir ${plural(o.upcomingCount, 'événement')}` : 'Voir les événements'}
          </span>
          <ArrowRight size={15} className={s.nextIcon} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
