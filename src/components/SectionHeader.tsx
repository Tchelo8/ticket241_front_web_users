import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import s from './SectionHeader.module.css';

/** Titre de section + lien « Tout voir ». */
export function SectionHeader({
  title, to, aside, id, tight,
}: { title: string; to?: string; aside?: ReactNode; id?: string; tight?: boolean }) {
  return (
    <div className={tight ? `${s.root} ${s.tight}` : s.root}>
      <div className={s.title}>
        <h2 className="section-title" id={id}>{title}</h2>
        {aside}
      </div>
      {to && <Link to={to} className="link-btn">Tout voir</Link>}
    </div>
  );
}
