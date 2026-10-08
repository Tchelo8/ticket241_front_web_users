import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { usePrefs } from './store/prefs';
import { useAuth } from './store/auth';
import { Loading } from './pages/Loading';

// Un fichier par écran, chargé à la demande.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ExplorerPage = lazy(() => import('./pages/ExplorerPage').then((m) => ({ default: m.ExplorerPage })));
const EventPage = lazy(() => import('./pages/EventPage').then((m) => ({ default: m.EventPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const WaitingPage = lazy(() => import('./pages/WaitingPage').then((m) => ({ default: m.WaitingPage })));
const SuccessPage = lazy(() => import('./pages/SuccessPage').then((m) => ({ default: m.SuccessPage })));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((m) => ({ default: m.TicketsPage })));
const TicketPage = lazy(() => import('./pages/TicketPage').then((m) => ({ default: m.TicketPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OtpVerificationPage = lazy(() => import('./pages/OtpVerificationPage').then((m) => ({ default: m.OtpVerificationPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

/** Bascule l'attribut data-theme sur <html>. */
function ThemeSync() {
  const theme = usePrefs((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

/** Route protégée : redirige vers /connexion?retour=… */
function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const { pathname, search } = useLocation();
  if (!user) return <Navigate to={`/connexion?retour=${encodeURIComponent(pathname + search)}`} replace />;
  return <>{children}</>;
}

export function App() {
  const { pathname } = useLocation();
  return (
    <>
      <ThemeSync />
      <ScrollToTop />
      <a href="#contenu" className="sr-only">Aller au contenu</a>
      <SiteHeader />
      {/* Changement de page : fondu de 300 ms (clé sur le chemin). */}
      <div key={pathname} id="contenu" className="page-fade">
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/evenements/:id" element={<EventPage />} />
          <Route path="/paiement" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/paiement/attente" element={<RequireAuth><WaitingPage /></RequireAuth>} />
          <Route path="/paiement/confirme" element={<RequireAuth><SuccessPage /></RequireAuth>} />
          <Route path="/billets" element={<RequireAuth><TicketsPage /></RequireAuth>} />
          <Route path="/billets/:ref" element={<RequireAuth><TicketPage /></RequireAuth>} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<SignupPage />} />
          <Route path="/inscription/verification" element={<OtpVerificationPage />} />
          <Route path="/profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </div>
      <SiteFooter />
    </>
  );
}
