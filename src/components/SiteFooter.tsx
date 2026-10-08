import { Logo } from './Logo';
import s from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <Logo height={28} />
        <nav className={s.links} aria-label="Liens utiles">
          <a href="#aide">Centre d'aide</a>
          <a href="#conditions">Conditions de vente</a>
          <a href="#organisateurs">Organisateurs</a>
          <a href="#confidentialite">Confidentialité</a>
        </nav>
        <div className={s.copy}>© 2026 Ticket241 · Libreville, Gabon</div>
      </div>
    </footer>
  );
}
