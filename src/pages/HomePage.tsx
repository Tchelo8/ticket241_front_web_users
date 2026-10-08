import { MagnifyingGlass, TrendUp } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useEvents } from '../api/hooks';
import { Dateline } from '../components/Dateline';
import { EventCard } from '../components/EventCard';
import { FeatureCard } from '../components/FeatureCard';
import { SectionHeader } from '../components/SectionHeader';
import { TrendRow } from '../components/TrendRow';
import { CITIES, HOME_LAYOUT } from '../mocks/events';
import { usePrefs } from '../store/prefs';
import { formatLongDateYear, plural } from '../lib/format';
import { today } from '../lib/clock';
import type { Event } from '../types';
import { Loading } from './Loading';
import s from './HomePage.module.css';

export function HomePage() {
  const { data: events, isLoading } = useEvents();
  const city = usePrefs((st) => st.city);
  const ci = CITIES.find((c) => c.name === city) ?? CITIES[0];

  if (isLoading || !events) return <Loading />;
  const byId = (id: string) => events.find((e) => e.id === id);
  const pick = (ids: string[]) => ids.map(byId).filter(Boolean) as Event[];
  const featured = byId(HOME_LAYOUT.featured) ?? events[0];
  const rows = [
    { title: 'Cette semaine', to: '/explorer', items: pick(HOME_LAYOUT.thisWeek) },
    { title: 'Concerts', to: '/explorer?cat=Concert', items: events.filter((e) => e.category === 'Concert').slice(0, 4) },
    { title: 'Sport', to: '/explorer?cat=Sport', items: events.filter((e) => e.category === 'Sport').slice(0, 4) },
  ];

  return (
    <main className="container">
      <h1 className="sr-only">Ticket241 · À l'affiche au Gabon</h1>
      <Dateline left={formatLongDateYear(today())} right={`${ci.region} · ${plural(ci.count, 'événement')}`} />

      <Link to="/explorer" className={s.search}>
        <MagnifyingGlass size={20} className={s.searchIcon} />
        <span>Concert, match, festival, artiste…</span>
      </Link>

      <section className={s.first} aria-labelledby="h-affiche">
        <SectionHeader id="h-affiche" title="À l'affiche" to="/explorer" />
        <div className={s.feature}>
          <FeatureCard event={featured} badge="Presque complet" />
          <div className={s.side}>
            {pick(HOME_LAYOUT.side).map((e) => (
              <FeatureCard key={e.id} event={e} size="sm" />
            ))}
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="h-tendances">
        <SectionHeader
          id="h-tendances"
          title="Tendances actuelles"
          tight
          aside={<span className={s.trend}><TrendUp size={15} />24 h</span>}
        />
        <div className={s.trendGrid}>
          {HOME_LAYOUT.trending.map((t, i) => {
            const e = byId(t.id);
            return e ? <TrendRow key={t.id} event={e} rank={i + 1} trend={t.trend} /> : null;
          })}
        </div>
      </section>

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
