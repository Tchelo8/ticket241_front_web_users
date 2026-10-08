import { Fragment, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LegalDocument } from '../content/legal';
import { useReducedMotion } from '../lib/useReducedMotion';
import { cx } from '../lib/cx';
import { PageDateline } from './PageDateline';
import s from './LegalPage.module.css';

/** Décalage de l'en-tête collant lors du défilement vers une section. */
export const SCROLL_OFFSET = 90;

const num = (i: number) => String(i + 1).padStart(2, '0');

/** Rend les liens Markdown « [libellé](/chemin) » d'un paragraphe. */
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    return m[2].startsWith('/') ? <Link key={i} to={m[2]}>{m[1]}</Link> : <a key={i} href={m[2]}>{m[1]}</a>;
  });
}

/** Gabarit des documents légaux : sommaire collant + article numéroté. */
export function LegalPage({ doc, asideExtra }: { doc: LegalDocument; asideExtra?: ReactNode }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const scrollTo = (id: string, behavior: ScrollBehavior) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior });
  };

  // Arrivée directe sur /conditions-de-vente#annulation.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) requestAnimationFrame(() => scrollTo(id, 'auto'));
  }, []);

  // Surligne la première section visible (dans l'ordre du document).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        const first = doc.sections.find((sec) => visible.has(sec.id));
        if (first) setActive(first.id);
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px` },
    );
    doc.sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [doc]);

  const jump = (e: MouseEvent, id: string) => {
    e.preventDefault();
    scrollTo(id, reduced ? 'auto' : 'smooth');
    window.history.replaceState(window.history.state, '', `#${id}`);
    setActive(id);
  };

  return (
    <main className="container container--md">
      <PageDateline left="Document légal" right={doc.updated} />
      <div className={s.cols}>
        <aside className={cx(s.aside, 'sticky-aside')}>
          <nav aria-labelledby="toc-title">
            <div className={s.tocTitle} id="toc-title">Sommaire</div>
            <ol className={s.toc}>
              {doc.sections.map((sec, i) => (
                <li key={sec.id} className={cx(active === sec.id && s.active)}>
                  <a
                    href={`#${sec.id}`}
                    className={s.tocLink}
                    aria-current={active === sec.id ? 'location' : undefined}
                    onClick={(e) => jump(e, sec.id)}
                  >
                    <span className={s.tocN}>{num(i)}</span>
                    <span className={s.tocT}>{sec.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          {asideExtra}
        </aside>
        <article className={s.article}>
          <h1 className={s.title}>{doc.title}</h1>
          <p className={s.lead}>{doc.lead}</p>
          {doc.sections.map((sec, i) => (
            <section key={sec.id} id={sec.id} className={s.section} aria-labelledby={`${sec.id}-t`}>
              <div className={s.sectionHead}>
                <span className={s.n}>{num(i)}</span>
                <h2 className={s.h2} id={`${sec.id}-t`}>{sec.title}</h2>
              </div>
              {sec.paragraphs.map((p, j) => (
                <p key={j} className={s.p}>{renderInline(p)}</p>
              ))}
            </section>
          ))}
          {/* À retirer une fois le texte validé. */}
          <div className={s.demo}>Texte de démonstration, à faire valider par un juriste avant publication.</div>
        </article>
      </div>
    </main>
  );
}
