import { Link, useLocation } from 'react-router-dom';
import { cx } from '../lib/cx';
import s from './NavLink.module.css';

/** Lien d'en-tête : actif → texte cyan 600 + barre 18×2px cyan dessous. */
export function NavLink({ to, children }: { to: string; children: string }) {
  const { pathname } = useLocation();
  const active = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} className={cx(s.link, active && s.active)} aria-current={active ? 'page' : undefined}>
      {children}
      <span className={s.bar} aria-hidden />
    </Link>
  );
}
