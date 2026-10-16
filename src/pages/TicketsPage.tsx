import { useRef, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass, Key, Receipt } from '@phosphor-icons/react';
import { useEvents, useTickets } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { TicketCard } from '../components/TicketCard';
import { isValidTicket } from '../components/TicketPass';
import { useAuth } from '../store/auth';
import { useGuestOrders } from '../store/guestOrders';
import { referenceNow } from '../lib/clock';
import { formatShortDate } from '../lib/format';
import { cx } from '../lib/cx';
import ticketsAnim from '../assets/lottie/Tickets.json';
import { Loading } from './Loading';
import s from './TicketsPage.module.css';

type Tab = 'upcoming' | 'past';
const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'À venir' },
  { id: 'past', label: 'Passés' },
];

/** Commandes passées sans compte sur cet appareil (le jeton reste dans le lien). */
function GuestOrdersSection() {
  const orders = useGuestOrders((st) => st.orders);
  return (
    <section aria-labelledby="h-guest" style={{ marginTop: 32 }}>
      <h2 className="screen-title" id="h-guest" style={{ fontSize: 22 }}>Achats sans compte</h2>
      {orders.length > 0 ? (
        <div className={s.list}>
          {orders.map((o) => (
            <Link key={o.orderId} to={`/commande/${encodeURIComponent(o.orderId)}#${o.token}`} className="btn btn--outline" style={{ justifyContent: 'flex-start' }}>
              <Receipt size={18} />{o.eventName} · commande du {formatShortDate(o.createdAt)}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--ink2)' }}>Aucun achat sans compte sur cet appareil.</p>
      )}
      <Link to="/retrouver-mes-billets" className="btn btn--outline" style={{ marginTop: 12 }}>
        <Key size={18} />Retrouver mes billets avec mon numéro
      </Link>
    </section>
  );
}

export function TicketsPage() {
  const [params, setParams] = useSearchParams();
  const user = useAuth((st) => st.user);
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

  // Sans compte : seulement les commandes de cet appareil et la récupération par code
  if (!user) {
    return (
      <main className="container container--sm">
        <h1 className="screen-title">Mes billets</h1>
        <p style={{ color: 'var(--ink2)' }}>
          <Link to={`/connexion?retour=${encodeURIComponent('/billets')}`}>Connectez-vous</Link> pour voir les billets de votre compte.
        </p>
        <GuestOrdersSection />
      </main>
    );
  }

  if (isLoading || !tickets) return <Loading />;

  const now = referenceNow().getTime();
  const rows = tickets
    .filter(isValidTicket)
    .filter((t) => (tab === 'past') === (t.status === 'USED' || new Date(t.startsAt).getTime() < now))
    .sort((a, b) => {
      const d = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
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
                ? "Vos prochains billets s'afficheront ici avec leur QR code et leur PDF."
                : 'Les billets utilisés ou des événements passés viendront ici.'
            }
            cta={<Link to="/explorer" className="btn btn--primary"><Compass size={19} />Explorer les événements</Link>}
          />
        ) : (
          <div className={s.list}>
            {rows.map((t) => (
              <TicketCard key={t.ref} ticket={t} event={events.find((e) => e.numericId === t.eventNumericId)} variant={tab} />
            ))}
          </div>
        )}
      </div>

      <GuestOrdersSection />
    </main>
  );
}
