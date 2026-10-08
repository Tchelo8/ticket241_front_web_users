import { Link } from 'react-router-dom';
import { Compass, MapPin } from '@phosphor-icons/react';
import { useEvents } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { FavButton } from '../components/FavButton';
import { usePrefs } from '../store/prefs';
import { formatShortDate, formatTime, fromPrice, plural } from '../lib/format';
import nofavAnim from '../assets/lottie/nofav.json';
import { Loading } from './Loading';
import s from './FavoritesPage.module.css';

export function FavoritesPage() {
  const favIds = usePrefs((st) => st.favIds);
  const { data: events, isLoading } = useEvents();
  if (isLoading || !events) return <Loading />;
  const favs = events.filter((e) => favIds.includes(e.id));

  return (
    <main className="container">
      <div className={s.head}>
        <h1 className="screen-title">Favoris</h1>
        <span className={s.count}>{plural(favs.length, 'événement')}</span>
      </div>
      <div className={s.rule} />
      {favs.length === 0 ? (
        <EmptyState
          lottie={nofavAnim}
          caption="Vos favoris"
          title="Rien de gardé"
          titleItalic="pour l'instant."
          body="Cliquez sur le cœur d'un événement et il vous attendra ici, avec son prix et sa date."
          cta={<Link to="/explorer" className="btn btn--primary"><Compass size={19} />Explorer les événements</Link>}
          secondary={<Link to="/" className="btn btn--outline">Voir l'affiche</Link>}
        />
      ) : (
        <div className={s.grid}>
          {favs.map((e) => (
            <article key={e.id} className={s.card}>
              <div className={s.media}>
                <img src={e.image} alt="" className="evimg" />
                <div className={s.shade} />
                <FavButton eventId={e.id} name={e.name} large />
                <div className={s.over}>
                  <div className={s.date}>{formatShortDate(e.startsAt)} · {formatTime(e.startsAt)}</div>
                  <h2 className={s.name}><Link to={`/evenements/${e.id}`}>{e.name}</Link></h2>
                </div>
              </div>
              <div className={s.foot}>
                <span className={s.venue}><MapPin size={15} color="var(--ink3)" />{e.venue}</span>
                <span className={s.price}>{fromPrice(e.priceFrom)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
