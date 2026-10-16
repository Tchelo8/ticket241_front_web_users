import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService } from '../api/apiService';
import { renderRoute } from '../test/utils';
import type { Organizer } from '../types';
import { OrganizersPage, matchesOrganizer } from './OrganizersPage';

const location = () => screen.getByTestId('location').textContent;
const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

const org = (id: string, name: string, type: string, city = 'Libreville', venue = ''): Organizer =>
  ({ id, name, type, city, venue, description: '', upcomingCount: 1 });

const ORGS = [
  org('1', 'Entre Nous Bar', 'Bars & clubs', 'Libreville', 'Quartier Louis'),
  org('2', 'Le Code Bar', 'Bars & clubs'),
  org('3', 'LINAF', 'Sport'),
  org('4', 'Institut Français', 'Culture', 'Port-Gentil'),
];

const renderOrgs = (url = '/organisateurs') => renderRoute('/organisateurs', <OrganizersPage />, url);

beforeEach(() => {
  vi.spyOn(apiService.organizers, 'list').mockResolvedValue(ORGS);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Annuaire des organisateurs (API)', () => {
  it('affiche les familles venues de l’API et les compteurs', async () => {
    renderOrgs();
    expect(await screen.findByRole('heading', { name: 'Bars & clubs', level: 2 })).toBeInTheDocument();
    expect(cardNames()).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Tous\s*4/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Sport\s*1/ })).toBeInTheDocument();
    expect(screen.getByText('4 structures')).toBeInTheDocument();
  });

  it('filtre par famille et synchronise l’URL', async () => {
    const user = userEvent.setup();
    renderOrgs();
    await user.click(await screen.findByRole('button', { name: /^Sport/ }));
    expect(location()).toBe('/organisateurs?type=Sport');
    expect(cardNames()).toEqual(['LINAF']);
  });

  it('cherche sur le nom, le type, le lieu et la ville', () => {
    expect(matchesOrganizer(ORGS[0], 'louis')).toBe(true);
    expect(matchesOrganizer(ORGS[3], 'port-gentil')).toBe(true);
    expect(matchesOrganizer(ORGS[2], 'francais')).toBe(false);
  });

  it('affiche un état vide quand l’annuaire est vide', async () => {
    vi.spyOn(apiService.organizers, 'list').mockResolvedValue([]);
    renderOrgs();
    expect(await screen.findByText("L'annuaire est encore vide")).toBeInTheDocument();
  });

  it('chaque carte mène aux événements de l’organisateur', async () => {
    renderOrgs();
    const links = await screen.findAllByRole('link', { name: /Voir/ });
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/explorer?organisateur='));
  });
});
