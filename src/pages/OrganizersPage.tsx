import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Buildings } from '@phosphor-icons/react';
import { useFollowing, useOrganizers, useToggleFollow } from '../api/hooks';
import { FilterChip } from '../components/Chip';
import { OrganizerCard } from '../components/OrganizerCard';
import { PageDateline } from '../components/PageDateline';
import { SearchPill } from '../components/SearchPill';
import { ORGANIZER_TYPES, type Organizer, type OrganizerType } from '../mocks/organizers';
import { SUPPORT } from '../config/support';
import { plural } from '../lib/format';
import { Loading } from './Loading';
import s from './OrganizersPage.module.css';

const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La recherche porte sur le nom, le type et la ville. */
export const matchesOrganizer = (o: Organizer, q: string) => {
  const needle = normalize(q.trim());
  return !needle || normalize(`${o.name} ${o.kind} ${o.city}`).includes(needle);
};

export function OrganizersPage() {
  const [params, setParams] = useSearchParams();
  const { data: organizers, isLoading } = useOrganizers();
  const { data: followed = [] } = useFollowing();
  const toggleFollow = useToggleFollow();

  // URL : ?type=Sport&q=bar
  const type = ORGANIZER_TYPES.includes(params.get('type') as OrganizerType) ? (params.get('type') as OrganizerType) : null;
  const q = params.get('q') ?? '';
  const update = (patch: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace });
  };

  const groups = useMemo(
    () =>
      ORGANIZER_TYPES.filter((t) => !type || t === type)
        .map((t) => ({ title: t, items: (organizers ?? []).filter((o) => o.type === t && matchesOrganizer(o, q)) }))
        .filter((g) => g.items.length > 0),
    [organizers, type, q],
  );

  if (isLoading || !organizers) return <Loading />;

  const counts = (t: OrganizerType | null) => (t ? organizers.filter((o) => o.type === t).length : organizers.length);
  const followedCount = followed.filter((id) => organizers.some((o) => o.id === id)).length;

  return (
    <main className="container">
      <PageDateline left="L'annuaire" right={`${plural(organizers.length, 'structure')} · ${followedCount} ${followedCount > 1 ? 'suivies' : 'suivie'}`} />

      <div className={s.intro}>
        <div className={s.introText}>
          <h1 className={s.title}>Organisateurs</h1>
          <p className={s.lead}>
            Bars, ligues, institutions et collectifs qui font vivre les soirées du Gabon. Suivez-les pour être prévenu de leurs prochaines dates.
          </p>
        </div>
        <SearchPill
          className={s.search}
          value={q}
          onChange={(v) => update({ q: v }, true)}
          placeholder="Bar, ligue, ville…"
          label="Rechercher un organisateur"
        />
      </div>

      <div className={s.filters} role="group" aria-label="Familles d'organisateurs">
        <FilterChip active={!type} count={counts(null)} onClick={() => update({ type: null })}>Tous</FilterChip>
        {ORGANIZER_TYPES.map((t) => (
          <FilterChip key={t} active={type === t} count={counts(t)} onClick={() => update({ type: t })}>{t}</FilterChip>
        ))}
      </div>

      <div aria-live="polite">
        {groups.length === 0 ? (
          <div className={s.empty}>
            <Buildings size={56} color="var(--ink3)" aria-hidden />
            <h2>Aucun organisateur trouvé</h2>
            <p>Essayez un autre nom ou une autre catégorie.</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.title} className={s.group} aria-labelledby={`fam-${g.title}`}>
              <h2 className={s.groupTitle} id={`fam-${g.title}`}>{g.title}</h2>
              <div className={s.rule} />
              <div className={s.grid}>
                {g.items.map((o) => {
                  const on = followed.includes(o.id);
                  return <OrganizerCard key={o.id} organizer={o} following={on} onToggleFollow={() => toggleFollow(o.id, on)} />;
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <section className={s.cta} aria-labelledby="cta-orga">
        <div className={s.ctaText}>
          <div className={s.ctaKicker}>Espace organisateur</div>
          <h2 className={s.ctaTitle} id="cta-orga">Vous organisez des soirées, des matchs, des concerts ?</h2>
          <p className={s.ctaBody}>
            Publiez votre billetterie, encaissez en Airtel Money et Moov Money, contrôlez les entrées au QR code. Sans frais d'installation.
          </p>
        </div>
        <div className={s.ctaActions}>
          <a className="btn btn--primary" href={`mailto:${SUPPORT.organizersEmail}?subject=${encodeURIComponent('Devenir organisateur')}`}>
            Devenir organisateur
          </a>
          <Link className={`btn btn--outline ${s.ctaSecondary}`} to="/aide?theme=Organisateurs">Comment ça marche</Link>
        </div>
      </section>
    </main>
  );
}
