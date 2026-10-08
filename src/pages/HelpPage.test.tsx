import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/utils';
import { HelpPage } from './HelpPage';

const location = () => screen.getByTestId('location').textContent;
const questions = () => screen.getAllByRole('button', { expanded: undefined }).filter((b) => b.hasAttribute('aria-expanded'));

describe('Centre d’aide', () => {
  it('ouvre par défaut la question sur la demande de paiement', () => {
    renderRoute('/aide', <HelpPage />);
    expect(screen.getByRole('region', { name: /pas reçu la demande de paiement/ })).toHaveTextContent('*150#');
    expect(questions()).toHaveLength(10);
  });

  it('filtre par thème depuis un raccourci et synchronise l’URL', async () => {
    const user = userEvent.setup();
    renderRoute('/aide', <HelpPage />);
    await user.click(screen.getByRole('button', { name: /Annulation Remboursement sous 48 h/ }));
    expect(location()).toBe('/aide?theme=Annulation');
    expect(questions()).toHaveLength(2);
  });

  it('cherche dans les questions et les réponses, depuis l’URL', () => {
    renderRoute('/aide', <HelpPage />, '/aide?theme=Paiement&q=rembours');
    expect(questions().map((q) => q.textContent)).toEqual(['PaiementJ’ai été débité mais je n’ai pas de billet.']);
  });

  it('indique quand aucune réponse ne correspond', async () => {
    const user = userEvent.setup();
    renderRoute('/aide', <HelpPage />);
    await user.type(screen.getByRole('searchbox'), 'kangourou');
    expect(screen.getByText(/Aucune réponse ne correspond/)).toBeInTheDocument();
    expect(location()).toBe('/aide?q=kangourou');
  });
});
