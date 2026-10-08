import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderRoute } from '../test/utils';
import { TermsPage } from '../pages/LegalPages';
import { SCROLL_OFFSET } from './LegalPage';

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('LegalPage — sommaire', () => {
  it('liste les sections numérotées avec des ancres', () => {
    renderRoute('/conditions-de-vente', <TermsPage />);
    const toc = screen.getByRole('navigation', { name: 'Sommaire' });
    const links = within(toc).getAllByRole('link');
    expect(links).toHaveLength(8);
    expect(links[4]).toHaveTextContent('05Annulation et remboursement');
    expect(links[4]).toHaveAttribute('href', '#annulation');
    expect(document.getElementById('annulation')).toHaveTextContent('Annulation et remboursement');
  });

  it('défile en douceur jusqu’à la section, sous l’en-tête, et met à jour le hash', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    renderRoute('/conditions-de-vente', <TermsPage />);
    const section = document.getElementById('annulation')!;
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 1200 } as DOMRect);

    await user.click(screen.getByRole('link', { name: /Annulation et remboursement/ }));

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 1200 + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' });
    expect(window.location.hash).toBe('#annulation');
    expect(screen.getByRole('link', { name: /Annulation et remboursement/ })).toHaveAttribute('aria-current', 'location');
  });

  it('relie la section Données personnelles à la politique de confidentialité', () => {
    renderRoute('/conditions-de-vente', <TermsPage />);
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute('href', '/confidentialite');
  });
});
