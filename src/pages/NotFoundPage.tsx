import { Compass, MagnifyingGlass } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export function NotFoundPage() {
  return (
    <main className="container container--sm">
      <EmptyState
        headingLevel="h1"
        icon={<MagnifyingGlass size={96} color="var(--acc)" />}
        title="Page introuvable"
        titleItalic="ou déjà terminée."
        body="Le lien est peut-être ancien. Repartez de l'affiche ou explorez les événements à venir."
        cta={<Link to="/explorer" className="btn btn--primary"><Compass size={19} />Explorer les événements</Link>}
        secondary={<Link to="/" className="btn btn--outline">Voir l'affiche</Link>}
      />
    </main>
  );
}
