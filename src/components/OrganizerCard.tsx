import { ArrowRight, CalendarStar, MapPin, SealCheck } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { MONOGRAMS, type Organizer } from '../mocks/organizers';
import { groupNumber } from '../lib/format';
import { FollowButton } from './FollowButton';
import s from './OrganizerCard.module.css';

export const organizerHref = (o: Organizer) =>
  o.nextEvent?.id ? `/evenements/${o.nextEvent.id}` : `/explorer?organisateur=${encodeURIComponent(o.id)}`;

const monogram = (o: Organizer) =>
  MONOGRAMS[o.id] ?? o.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

/** Carte d'organisateur : bandeau, monogramme, Suivre, statistiques et prochain événement. */
export function OrganizerCard({ organizer: o, following, onToggleFollow }: { organizer: Organizer; following: boolean; onToggleFollow: () => void }) {
  return (
    <article className={s.card} aria-labelledby={`org-${o.id}`}>
      <div className={s.cover}>
        <img src={o.cover} alt="" className="evimg" loading="lazy" />
        <div className={s.coverShade} />
        <span className={s.kind}>{o.kind}</span>
      </div>
      <div className={s.body}>
        <div className={s.head}>
          <div className={s.mono} aria-hidden>
            {o.logo ? <img src={o.logo} alt="" /> : monogram(o)}
          </div>
          <span className={s.follow}>
            <FollowButton following={following} onToggle={onToggleFollow} name={o.name} />
          </span>
        </div>
        <div className={s.nameRow}>
          <h3 className={s.name} id={`org-${o.id}`}>{o.name}</h3>
          {o.verified && (
            <span className={s.verified} role="img" aria-label="Organisateur vérifié" title="Organisateur vérifié">
              <SealCheck size={17} weight="fill" aria-hidden />
            </span>
          )}
        </div>
        <div className={s.place}>
          <MapPin size={14} aria-hidden />
          <span>{o.area}, {o.city}</span>
          {o.since && <span>· Depuis {o.since}</span>}
        </div>
        <p className={s.desc}>{o.description}</p>
        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.statN}>{o.upcomingCount}</div>
            <div className={s.statL}>À venir</div>
          </div>
          <div className={s.stat}>
            <div className={s.statN}>{groupNumber(o.followers)}</div>
            <div className={s.statL}>Abonnés</div>
          </div>
        </div>
        <Link to={organizerHref(o)} className={s.next}>
          <CalendarStar size={18} className={s.nextIcon} aria-hidden />
          <span className={s.nextLabel}>
            <span className="sr-only">Prochain événement : </span>
            {o.nextEvent?.label ?? 'Voir les événements'}
          </span>
          <ArrowRight size={15} className={s.nextIcon} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
