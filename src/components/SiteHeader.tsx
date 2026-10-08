import { Link, useLocation } from 'react-router-dom';
import { useAuth, fullName } from '../store/auth';
import { initials } from '../lib/format';
import { CityMenu } from './CityMenu';
import { Logo } from './Logo';
import { NavLink } from './NavLink';
import { ThemeSwitch } from './ThemeSwitch';
import s from './SiteHeader.module.css';

/** En-tête collant en verre dépoli. */
export function SiteHeader() {
  const user = useAuth((st) => st.user);
  const { pathname, search } = useLocation();
  const retour = pathname.startsWith('/connexion') || pathname.startsWith('/inscription') ? '' : pathname + search;
  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link to="/" className={s.logo} aria-label="Ticket241, accueil">
          <Logo height={34} />
        </Link>
        <nav className={s.nav} aria-label="Navigation principale">
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/explorer">Explorer</NavLink>
          <NavLink to="/billets">Mes billets</NavLink>
          <NavLink to="/favoris">Favoris</NavLink>
        </nav>
        <CityMenu />
        <ThemeSwitch />
        {user ? (
          <Link to="/profil" className={s.avatar} aria-label={`Profil de ${fullName(user)}`}>
            {initials(fullName(user))}
          </Link>
        ) : (
          <Link to={retour ? `/connexion?retour=${encodeURIComponent(retour)}` : '/connexion'} className={s.login}>
            Se connecter
          </Link>
        )}
      </div>
    </header>
  );
}
