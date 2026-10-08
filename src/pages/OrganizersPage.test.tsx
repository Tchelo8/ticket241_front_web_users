import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_USER, mockConfig, resetMockServer } from '../api/mockServer';
import { useAuth } from '../store/auth';
import { renderRoute } from '../test/utils';
import { OrganizersPage } from './OrganizersPage';

const location = () => screen.getByTestId('location').textContent;
const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

const renderOrgs = (url = '/organisateurs') =>
  renderRoute('/organisateurs', <OrganizersPage />, url, [{ path: '/connexion', element: <p>Connexion</p> }]);

beforeEach(() => {
  resetMockServer();
  mockConfig.latencyFactor = 0;
  useAuth.setState({ user: DEMO_USER });
});

describe('Annuaire des organisateurs', () => {
  it('affiche les quatre familles et les compteurs', async () => {
    renderOrgs();
    expect(await screen.findByRole('heading', { name: 'Bars & clubs', level: 2 })).toBeInTheDocument();
    expect(cardNames()).toHaveLength(12);
    expect(screen.getByRole('button', { name: /Tous\s*12/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Sport\s*3/ })).toBeInTheDocument();
    expect(await screen.findByText('12 structures · 2 suivies')).toBeInTheDocument();
  });

  it('filtre par famille et synchronise l’URL', async () => {
    const user = userEvent.setup();
    renderOrgs();
    await user.click(await screen.findByRole('button', { name: /^Sport/ }));
    expect(location()).toBe('/organisateurs?type=Sport');
    expect(screen.queryByRole('heading', { name: 'Bars & clubs', level: 2 })).not.toBeInTheDocument();
    expect(cardNames()).toEqual(['LINAF', 'Fédération Gabonaise de Basket', 'Gabon Trail Collectif']);
  });

  it('cherche sur le nom, le type et la ville, depuis l’URL', async () => {
    renderOrgs('/organisateurs?q=bar');
    await screen.findByRole('heading', { name: 'Bars & clubs', level: 2 });
    expect(cardNames()).toEqual(['Entre Nous Bar', 'Le Code Bar', 'Le Palenqué']);
    expect(screen.getByRole('searchbox')).toHaveValue('bar');
  });

  it('met la recherche dans l’URL et affiche l’état vide', async () => {
    const user = userEvent.setup();
    renderOrgs();
    const search = await screen.findByRole('searchbox', { name: 'Rechercher un organisateur' });
    await user.type(search, 'franceville');
    expect(location()).toBe('/organisateurs?q=franceville');
    expect(cardNames()).toEqual(['Mairie de Franceville']);

    await user.type(search, 'zzz');
    expect(screen.getByText('Aucun organisateur trouvé')).toBeInTheDocument();
  });
});

describe('Bouton Suivre', () => {
  it('bascule immédiatement (mise à jour optimiste)', async () => {
    // Réponse du serveur retardée : on observe l'état avant qu'elle arrive.
    mockConfig.latencyFactor = 0.4;
    const user = userEvent.setup();
    renderOrgs();
    const card = (await screen.findByRole('article', { name: 'Le Code Bar' }));
    const button = await within(card).findByRole('button', { name: 'Suivre Le Code Bar' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    // Avant la réponse de l'API.
    expect(within(card).getByRole('button', { name: 'Ne plus suivre Le Code Bar' })).toHaveTextContent('Suivi');
    expect(location()).toBe('/organisateurs');
    await waitFor(() => expect(screen.getByText('12 structures · 3 suivies')).toBeInTheDocument());
  });

  it('revient en arrière si l’API échoue', async () => {
    const user = userEvent.setup();
    renderOrgs();
    const card = await screen.findByRole('article', { name: 'Institut Français du Gabon' });
    const button = await within(card).findByRole('button', { name: 'Ne plus suivre Institut Français du Gabon' });
    mockConfig.failNextFollow = true;
    await user.click(button);
    await waitFor(() =>
      expect(within(card).getByRole('button', { name: 'Ne plus suivre Institut Français du Gabon' })).toHaveAttribute('aria-pressed', 'true'),
    );
  });

  it('redirige un invité vers la connexion', async () => {
    useAuth.setState({ user: null });
    const user = userEvent.setup();
    renderOrgs('/organisateurs?type=Sport');
    await user.click(await screen.findByRole('button', { name: 'Suivre LINAF' }));
    expect(location()).toBe('/connexion?retour=%2Forganisateurs%3Ftype%3DSport');
  });
});
