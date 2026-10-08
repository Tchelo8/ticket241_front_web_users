import { useRef, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass } from '@phosphor-icons/react';
import { useEvents, useTickets } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { TicketCard } from '../components/TicketCard';
import { isPast } from '../lib/events';
import { cx } from '../lib/cx';
import ticketsAnim from '../assets/lottie/Tickets.json';
import { Loading } from './Loading';
import s from './TicketsPage.module.css';

type Tab = 'upcoming' | 'past';
const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Passés' },
];

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('onglet') === 'passes' ? 'past' : 'upcoming';
  const setTab = (t: Tab) => setParams(t === 'past' ? { onglet: 'passes' } : {}, { replace: true });
  const { data: tickets, isLoading } = useTickets();
  const { data: events = [] } = useEvents();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next: Tab = tab === 'upcoming' ? 'past' : 'upcoming';
    setTab(next);
    tabRefs.current[next === 'upcoming' ? 0 : 1]?.focus();
  };

  if (isLoading || !tickets) return <Loading />;

  const rows = tickets
    .map((t) => ({ t, ev: events.find((e) => e.id === t.eventId) }))
    .filter((r): r is { t: typeof r.t; ev: NonNullable<typeof r.ev> } => !!r.ev)
    .filter(({ t, ev }) => (tab === 'past') === (!!t.usedAt || isPast(ev)))
    .sort((a, b) => {
      const d = new Date(a.ev.startsAt).getTime() - new Date(b.ev.startsAt).getTime();
      return tab === 'past' ? -d : d;
    });

  return (
    <main className="container container--sm">
      <h1 className="screen-title">Mes billets</h1>
      <div className={s.tabs} role="tablist" aria-label="Billets">
        <div className={cx(s.thumb, tab === 'past' && s.thumbPast)} aria-hidden />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="tickets-panel"
            tabIndex={tab === t.id ? 0 : -1}
            className={cx(s.tab, tab === t.id && s.tabOn)}
            onClick={() => setTab(t.id)}
            onKeyDown={onKey}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Clé sur l'onglet : le contenu se remonte en `rise` à chaque bascule. */}
      <div key={tab} id="tickets-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className={s.panel}>
        {rows.length === 0 ? (
          <EmptyState
            lottie={ticketsAnim}
            caption={tab === 'upcoming' ? 'Billets à venir' : 'Archives'}
            title={tab === 'upcoming' ? 'Aucun billet à venir.' : 'Rien dans les archives.'}
            body={
              tab === 'upcoming'
                ? "Vos prochains billets s'afficheront ici avec leur QR code, prêts même sans réseau."
                : 'Les billets utilisés viendront ici, avec les reçus à télécharger.'
            }
            cta={<Link to="/explorer" className="btn btn--primary"><Compass size={19} />Explorer les événements</Link>}
          />
        ) : (
          <div className={s.list}>
            {rows.map(({ t, ev }) => (
              <TicketCard key={t.ref} ticket={t} event={ev} variant={tab} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
