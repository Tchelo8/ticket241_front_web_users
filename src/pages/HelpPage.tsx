import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ArrowUUpLeft, Clock, DeviceMobile, EnvelopeSimple, FileText, Ticket, UserCircle, WhatsappLogo, type Icon,
} from '@phosphor-icons/react';
import { Accordion, AccordionItem } from '../components/Accordion';
import { FilterChip } from '../components/Chip';
import { PageDateline } from '../components/PageDateline';
import { SearchPill } from '../components/SearchPill';
import { FAQ, FAQ_DEFAULT_OPEN, FAQ_THEMES, type FaqEntry, type FaqTheme } from '../mocks/faq';
import { SUPPORT, whatsappUrl } from '../config/support';
import { cx } from '../lib/cx';
import s from './HelpPage.module.css';

const TOPICS: { theme: FaqTheme; Icon: Icon; desc: string }[] = [
  { theme: 'Billets', Icon: Ticket, desc: 'Retrouver, télécharger, transférer' },
  { theme: 'Paiement', Icon: DeviceMobile, desc: 'Airtel Money, Moov Money' },
  { theme: 'Annulation', Icon: ArrowUUpLeft, desc: 'Remboursement sous 48 h' },
  { theme: 'Compte', Icon: UserCircle, desc: 'Numéro, mot de passe, profil' },
];

const normalize = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Filtre sur la question et la réponse. */
export const matchesFaq = (f: FaqEntry, q: string) => {
  const needle = normalize(q.trim());
  return !needle || normalize(`${f.q} ${f.a}`).includes(needle);
};

export function HelpPage() {
  const [params, setParams] = useSearchParams();
  // URL : ?theme=Paiement&q=rembours
  const theme = FAQ_THEMES.includes(params.get('theme') as FaqTheme) ? (params.get('theme') as FaqTheme) : null;
  const q = params.get('q') ?? '';
  const [openId, setOpenId] = useState<string | null>(FAQ_DEFAULT_OPEN);

  const update = (patch: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace });
  };

  const items = useMemo(() => FAQ.filter((f) => (!theme || f.theme === theme) && matchesFaq(f, q)), [theme, q]);

  return (
    <main className="container container--md">
      <PageDateline left="Centre d'aide" right="Réponse sous 24 h · 7 j / 7" />
      <h1 className={s.title}>
        Comment pouvons-nous <span>vous aider ?</span>
      </h1>
      <SearchPill
        className={s.search}
        size="lg"
        value={q}
        onChange={(v) => update({ q: v }, true)}
        placeholder="Remboursement, QR code, Airtel Money…"
        label="Rechercher dans l'aide"
      />

      <div className={s.topics}>
        {TOPICS.map(({ theme: t, Icon: Ico, desc }) => (
          <button
            key={t}
            type="button"
            className={cx(s.topic, theme === t && s.topicOn)}
            aria-pressed={theme === t}
            onClick={() => update({ theme: t })}
          >
            <Ico size={26} className={s.topicIcon} aria-hidden />
            <span className={s.topicT}>{t}</span>
            <span className={s.topicD}>{desc}</span>
          </button>
        ))}
      </div>

      <div className={s.cols}>
        <section className={s.faq} aria-labelledby="h-faq">
          <h2 className="section-title" id="h-faq">Questions fréquentes</h2>
          <div className={s.cats} role="group" aria-label="Thèmes">
            <FilterChip size="md" active={!theme} onClick={() => update({ theme: null })}>Tout</FilterChip>
            {FAQ_THEMES.map((t) => (
              <FilterChip key={t} size="md" active={theme === t} onClick={() => update({ theme: t })}>{t}</FilterChip>
            ))}
          </div>
          {items.length > 0 ? (
            <div className={s.list}>
              <Accordion openId={openId} onChange={setOpenId}>
                {items.map((f) => (
                  <AccordionItem key={f.id} id={f.id} tag={f.theme} question={f.q}>{f.a}</AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <p className={s.none} role="status">Aucune réponse ne correspond. Écrivez-nous, nous répondons sous 24 heures.</p>
          )}
        </section>

        <aside className={cx(s.aside, 'sticky-aside')} aria-label="Contact">
          <div className={s.contact}>
            <div className="overline">Nous contacter</div>
            <h2 className={s.contactTitle}>Une question sur une commande ?</h2>
            <p className={s.contactBody}>Gardez la référence de votre billet (TK241-…) à portée de main.</p>
            <div className={s.contactActions}>
              <a className={`btn btn--primary ${s.wa}`} href={whatsappUrl()} target="_blank" rel="noreferrer">
                <WhatsappLogo size={19} />Écrire sur WhatsApp
              </a>
              <a className={`btn btn--outline ${s.mail}`} href={`mailto:${SUPPORT.email}`}>
                <EnvelopeSimple size={18} />{SUPPORT.email}
              </a>
            </div>
            <div className={s.hours}><Clock size={15} aria-hidden />{SUPPORT.hours}</div>
          </div>
          <Link to="/conditions-de-vente" className={s.terms}>
            <FileText size={21} color="var(--acc)" aria-hidden />
            <span className={s.termsLabel}>Conditions de vente</span>
            <ArrowRight size={15} color="var(--ink3)" aria-hidden />
          </Link>
        </aside>
      </div>
    </main>
  );
}
