import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarBlank, Check, Confetti, ImageSquare, MagnifyingGlass, MaskHappy, MusicNotes, ShieldCheck,
  SlidersHorizontal, SoccerBall, SquaresFour, Tag, TrendUp, XCircle, type Icon,
} from '@phosphor-icons/react';
import { useEvents } from '../api/hooks';
import { Chip, RemovableChip } from '../components/Chip';
import { DoubleRule } from '../components/DoubleRule';
import { EventCard } from '../components/EventCard';
import { Toggle } from '../components/Toggle';
import { CATEGORIES } from '../mocks/events';
import { ORGANIZERS } from '../mocks/organizers';
import { usePrefs } from '../store/prefs';
import { fcfa, fcfaShort, monthOf, plural } from '../lib/format';
import { sold } from '../lib/events';
import { today } from '../lib/clock';
import { cx } from '../lib/cx';
import s from './ExplorerPage.module.css';

const CAT_ICONS: Record<string, Icon> = {
  Tous: SquaresFour, Concert: MusicNotes, Sport: SoccerBall, Festival: Confetti, 'Théâtre': MaskHappy, Exposition: ImageSquare,
};

const PRICE_MIN = 2000;
const PRICE_MAX = 20000;

const WHEN_OPTS = ['Tous', 'Ce mois-ci', 'Septembre', 'Août'] as const;
type When = (typeof WHEN_OPTS)[number];
const whenMonth = (w: When): number | null =>
  w === 'Ce mois-ci' ? monthOf(today()) : w === 'Septembre' ? 9 : w === 'Août' ? 8 : null;

const SORTS = [
  { id: 'date', label: 'Date · les plus proches', Icon: CalendarBlank },
  { id: 'prix', label: 'Prix croissant', Icon: Tag },
  { id: 'popularite', label: 'Popularité', Icon: TrendUp },
] as const;
type Sort = (typeof SORTS)[number]['id'];

export function ExplorerPage() {
  const [params, setParams] = useSearchParams();
  const { data: events = [], isLoading } = useEvents();
  const city = usePrefs((st) => st.city);

  // Filtres lus dans l'URL : ?cat=Concert&max=10000&quand=Septembre&tri=prix&remb=1&q=jazz
  const cat = CATEGORIES.includes(params.get('cat') as never) ? (params.get('cat') as string) : 'Tous';
  const maxRaw = Number(params.get('max'));
  const max = maxRaw >= PRICE_MIN && maxRaw <= PRICE_MAX ? maxRaw : PRICE_MAX;
  const when: When = WHEN_OPTS.includes(params.get('quand') as When) ? (params.get('quand') as When) : 'Tous';
  const sort: Sort = SORTS.some((o) => o.id === params.get('tri')) ? (params.get('tri') as Sort) : 'date';
  const refundable = params.get('remb') === '1';
  const q = params.get('q') ?? '';
  // Depuis l'annuaire : ?organisateur=ifg
  const orgId = params.get('organisateur');
  const org = orgId ? ORGANIZERS.find((o) => o.id === orgId) : undefined;

  const update = (patch: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace });
  };
  const reset = () => setParams(new URLSearchParams());

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const month = whenMonth(when);
    return events
      .filter((e) =>
        (cat === 'Tous' || e.category === cat) &&
        (!needle || [e.name, e.venue, e.city].some((t) => t.toLowerCase().includes(needle))) &&
        e.priceFrom <= max &&
        (month === null || monthOf(e.startsAt) === month) &&
        (!refundable || e.refundable) &&
        (!orgId || e.organizer.id === orgId),
      )
      .sort((a, b) =>
        sort === 'prix' ? a.priceFrom - b.priceFrom
          : sort === 'popularite' ? sold(b) - sold(a)
            : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }, [events, cat, q, max, when, refundable, sort, orgId]);

  const active = [
    cat !== 'Tous' && { label: cat, clear: () => update({ cat: null }) },
    when !== 'Tous' && { label: when, clear: () => update({ quand: null }) },
    max < PRICE_MAX && { label: '≤ ' + fcfaShort(max), clear: () => update({ max: null }) },
    refundable && { label: 'Remboursable', clear: () => update({ remb: null }) },
    orgId && { label: org?.name ?? orgId, clear: () => update({ organisateur: null }) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <main className="container">
      <h1 className="screen-title">Explorer</h1>
      <div className={s.search} role="search">
        <MagnifyingGlass size={20} color="var(--ink2)" aria-hidden />
        <label htmlFor="explorer-q" className="sr-only">Rechercher</label>
        <input
          id="explorer-q"
          type="search"
          value={q}
          onChange={(e) => update({ q: e.target.value }, true)}
          placeholder="Rechercher un événement, un lieu, un artiste…"
          autoComplete="off"
        />
        {q && (
          <button type="button" className={s.clear} aria-label="Effacer la recherche" onClick={() => update({ q: null }, true)}>
            <XCircle size={18} />
          </button>
        )}
      </div>
      <div className={s.cats} role="group" aria-label="Catégories">
        {CATEGORIES.map((c) => {
          const Ico = CAT_ICONS[c];
          return (
            <Chip key={c} active={cat === c} icon={<Ico size={16} />} onClick={() => update({ cat: c === 'Tous' ? null : c })}>
              {c}
            </Chip>
          );
        })}
      </div>

      <div className={s.layout}>
        <aside className={cx(s.aside, 'sticky-aside')} aria-label="Filtres">
          <div className={s.asideHead}>
            <div className={s.asideTitle}>
              <SlidersHorizontal size={16} color="var(--acc)" />Filtres
              {active.length > 0 && (
                <span className={s.count} aria-label={`${active.length} actifs`}>{active.length}</span>
              )}
            </div>
            <button type="button" className={cx('link-btn', s.reset)} onClick={reset}>Réinitialiser</button>
          </div>
          <DoubleRule style={{ marginTop: 12 }} />

          <div className={s.groupFirst}>
            <label htmlFor="budget" className="overline">Budget maximum</label>
            <div className={s.budget} aria-hidden>{fcfa(max)}</div>
            <input
              id="budget"
              type="range"
              className={s.range}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={1000}
              value={max}
              aria-valuetext={fcfa(max)}
              onChange={(e) => update({ max: Number(e.target.value) >= PRICE_MAX ? null : e.target.value }, true)}
            />
            <div className={s.rangeLabels} aria-hidden><span>{fcfaShort(PRICE_MIN)}</span><span>{fcfaShort(PRICE_MAX)}</span></div>
          </div>

          <div className={s.group} role="group" aria-labelledby="f-quand">
            <div className="overline" id="f-quand">Quand</div>
            <div className={s.whens}>
              {WHEN_OPTS.map((w) => (
                <Chip key={w} small active={when === w} onClick={() => update({ quand: w === 'Tous' ? null : w })}>{w}</Chip>
              ))}
            </div>
          </div>

          <div className={s.group}>
            <div className="overline" id="f-tri">Trier par</div>
            <div className={s.sorts} role="radiogroup" aria-labelledby="f-tri">
              {SORTS.map(({ id, label, Icon: Ico }) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={sort === id}
                  className={cx(s.sort, sort === id && s.sortOn)}
                  onClick={() => update({ tri: id === 'date' ? null : id })}
                >
                  <Ico size={18} />
                  <span className={s.label}>{label}</span>
                  <span className={s.radio} aria-hidden>{sort === id && <Check size={10} weight="bold" />}</span>
                </button>
              ))}
            </div>
          </div>

          <Toggle className={s.refund} on={refundable} onChange={(v) => update({ remb: v ? '1' : null })}>
            <span className={s.refundText}>
              <ShieldCheck size={19} color="var(--acc)" />
              <span>
                <span className={s.refundTitle}>Annulation gratuite</span>
                <span className={s.refundSub}>Remboursable sous 48 h</span>
              </span>
            </span>
          </Toggle>
        </aside>

        <div className={s.results}>
          <div className={s.summary}>
            <div className={s.resultCount} role="status">
              {isLoading ? 'Chargement…' : `${plural(results.length, 'événement')} · ${city}`}
            </div>
            {active.map((f) => (
              <RemovableChip key={f.label} label={f.label} onRemove={f.clear} />
            ))}
          </div>

          {!isLoading && results.length === 0 ? (
            <div className={s.empty}>
              <MagnifyingGlass size={60} color="var(--ink3)" />
              <h2>Aucun événement ne correspond</h2>
              <p>Essayez d'élargir le budget ou de retirer un filtre.</p>
              <button type="button" className={cx('btn btn--outline', s.emptyBtn)} onClick={reset}>Réinitialiser les filtres</button>
            </div>
          ) : (
            <div className={s.grid}>
              {results.map((e) => (
                <EventCard key={e.id} event={e} animate />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
