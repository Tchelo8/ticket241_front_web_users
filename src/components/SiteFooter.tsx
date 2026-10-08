import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import s from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <Logo height={28} />
        <nav className={s.links} aria-label="Liens utiles">
          <Link to="/aide">Centre d'aide</Link>
          <Link to="/conditions-de-vente">Conditions de vente</Link>
          <Link to="/organisateurs">Organisateurs</Link>
          <Link to="/confidentialite">Confidentialité</Link>
        </nav>
        <div className={s.copy}>© 2026 Ticket241 · Libreville, Gabon</div>
      </div>
    </footer>
  );
}
