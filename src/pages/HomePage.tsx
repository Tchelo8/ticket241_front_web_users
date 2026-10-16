import { MagnifyingGlass, TrendUp } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useCities, useEvents } from '../api/hooks';
import { Dateline } from '../components/Dateline';
import { EventCard } from '../components/EventCard';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeader } from '../components/SectionHeader';
import { TrendRow } from '../components/TrendRow';
import { usePrefs } from '../store/prefs';
import { formatLongDateYear, groupNumber, plural } from '../lib/format';
import { almostFull, homeLayout } from '../lib/events';
import { today } from '../lib/clock';
import { Loading } from './Loading';
import s from './HomePage.module.css';

export function HomePage() {
  const { data: events, isLoading } = useEvents();
  const { data: cities = [] } = useCities();
  const city = usePrefs((st) => st.city);

  if (isLoading || !events) return <Loading />;
  const { featured, side, trending, upcoming } = homeLayout(events);
  const region = cities.find((c) => c.name === city)?.region;
  const inCity = upcoming.filter((e) => e.city === city).length;
  const rows = [
    { title: 'Prochainement', to: '/explorer', items: upcoming.slice(0, 4) },
    { title: 'Concerts', to: '/explorer?cat=Concert', items: upcoming.filter((e) => e.category === 'Concert').slice(0, 4) },
    { title: 'Sport', to: '/explorer?cat=Sport', items: upcoming.filter((e) => e.category === 'Sport').slice(0, 4) },
  ].filter((row) => row.items.length > 0);

  return (
    <main className="container">
      <h1 className="sr-only">Ticket241 · À l'affiche au Gabon</h1>
      <Dateline left={formatLongDateYear(today())} right={`${region ? region + ' · ' : ''}${plural(inCity, 'événement')}`} />

      <Link to="/explorer" className={s.search}>
        <MagnifyingGlass size={20} className={s.searchIcon} />
        <span>Concert, match, festival, artiste…</span>
      </Link>

      {featured ? (
        <section className={s.first} aria-labelledby="h-affiche">
          <SectionHeader id="h-affiche" title="À l'affiche" to="/explorer" />
          <div className={s.feature}>
            <FeatureCard event={featured} badge={almostFull(featured) ? 'Presque complet' : undefined} />
            <div className={s.side}>
              {side.map((e) => (
                <FeatureCard key={e.id} event={e} size="sm" />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <p className={s.first}>Aucun événement à venir pour le moment.</p>
      )}

      {trending.length > 0 && (
        <section className={s.section} aria-labelledby="h-tendances">
          <SectionHeader
            id="h-tendances"
            title="Tendances actuelles"
            tight
            aside={<span className={s.trend}><TrendUp size={15} />Les plus vus</span>}
          />
          <div className={s.trendGrid}>
            {trending.map((e, i) => (
              <TrendRow key={e.id} event={e} rank={i + 1} trend={`${groupNumber(e.views ?? 0)} vues`} />
            ))}
          </div>
        </section>
      )}

      {rows.map((row) => (
        <section key={row.title} className={s.section} aria-label={row.title}>
          <SectionHeader title={row.title} to={row.to} />
          <div className={s.grid}>
            {row.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
