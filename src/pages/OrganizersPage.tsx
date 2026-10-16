import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Buildings } from '@phosphor-icons/react';
import { useOrganizers } from '../api/hooks';
import { FilterChip } from '../components/Chip';
import { OrganizerCard } from '../components/OrganizerCard';
import { PageDateline } from '../components/PageDateline';
import { SearchPill } from '../components/SearchPill';
import { SUPPORT } from '../config/support';
import { plural } from '../lib/format';
import type { Organizer } from '../types';
import { Loading } from './Loading';
import s from './OrganizersPage.module.css';

const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La recherche porte sur le nom, le type, le lieu et la ville. */
export const matchesOrganizer = (o: Organizer, q: string) => {
  const needle = normalize(q.trim());
  return !needle || normalize(`${o.name} ${o.type} ${o.venue} ${o.city}`).includes(needle);
};

/** Annuaire public : structures vérifiées par Ticket241 (GET /api/events/structures/public). */
export function OrganizersPage() {
  const [params, setParams] = useSearchParams();
  const { data: organizers, isLoading, isError } = useOrganizers();

  // Familles présentes dans l'annuaire (champ « type » des structures)
  const types = useMemo(
    () => Array.from(new Set((organizers ?? []).map((o) => o.type))).sort((a, b) => a.localeCompare(b, 'fr')),
    [organizers],
  );

  // URL : ?type=Sport&q=bar
  const rawType = params.get('type');
  const type = rawType && types.includes(rawType) ? rawType : null;
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
      types
        .filter((t) => !type || t === type)
        .map((t) => ({ title: t, items: (organizers ?? []).filter((o) => o.type === t && matchesOrganizer(o, q)) }))
        .filter((g) => g.items.length > 0),
    [organizers, types, type, q],
  );

  if (isLoading) return <Loading />;
  if (isError || !organizers) {
    return (
      <main className="container">
        <h1 className={s.title}>Organisateurs</h1>
        <p>L'annuaire est momentanément indisponible. Réessayez dans quelques instants.</p>
      </main>
    );
  }

  const counts = (t: string | null) => (t ? organizers.filter((o) => o.type === t).length : organizers.length);

  return (
    <main className="container">
      <PageDateline left="L'annuaire" right={plural(organizers.length, 'structure')} />

      <div className={s.intro}>
        <div className={s.introText}>
          <h1 className={s.title}>Organisateurs</h1>
          <p className={s.lead}>
            Bars, ligues, institutions et collectifs qui font vivre les soirées du Gabon. Retrouvez leurs prochaines dates en un clic.
          </p>
        </div>
        <SearchPill
          className={s.search}
          value={q}
          onChange={(v) => update({ q: v }, true)}
          placeholder="Nom, lieu, ville…"
          label="Rechercher un organisateur"
        />
      </div>

      <div className={s.filters} role="group" aria-label="Familles d'organisateurs">
        <FilterChip active={!type} count={counts(null)} onClick={() => update({ type: null })}>Tous</FilterChip>
        {types.map((t) => (
          <FilterChip key={t} active={type === t} count={counts(t)} onClick={() => update({ type: t })}>{t}</FilterChip>
        ))}
      </div>

      <div aria-live="polite">
        {groups.length === 0 ? (
          <div className={s.empty}>
            <Buildings size={56} color="var(--ink3)" aria-hidden />
            <h2>{organizers.length ? 'Aucun organisateur trouvé' : "L'annuaire est encore vide"}</h2>
            <p>{organizers.length ? 'Essayez un autre nom ou une autre catégorie.' : 'Les organisateurs vérifiés apparaîtront ici.'}</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.title} className={s.group} aria-labelledby={`fam-${g.title}`}>
              <h2 className={s.groupTitle} id={`fam-${g.title}`}>{g.title}</h2>
              <div className={s.rule} />
              <div className={s.grid}>
                {g.items.map((o) => (
                  <OrganizerCard key={o.id} organizer={o} />
                ))}
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
