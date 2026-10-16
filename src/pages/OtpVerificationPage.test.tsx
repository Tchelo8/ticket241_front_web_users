import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiService, OtpError, type Session } from '../api/apiService';
import { useAuth } from '../store/auth';
import { useSignup } from '../store/signup';
import { OtpVerificationPage } from './OtpVerificationPage';

const PHONE = '074 12 34 56';
const DRAFT = { firstName: 'Alida', lastName: 'Nzé Mba', email: 'alida.nze@example.ga', phone: PHONE };
const SESSION: Session = { user: DRAFT, token: 'jwt-abc' };

/** Inscription déjà envoyée (POST /auth/register) : on attend le code reçu par e-mail. */
function startSignup(retour = '/') {
  useSignup.setState({ fields: DRAFT, password: '', pending: true, retour });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/inscription/verification']}>
      <Routes>
        <Route path="/inscription/verification" element={<OtpVerificationPage />} />
        <Route path="/inscription" element={<p>Formulaire d'inscription</p>} />
        <Route path="/" element={<p>Accueil</p>} />
        <Route path="/billets" element={<p>Mes billets</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const input = () => screen.getByLabelText('Code à six chiffres') as HTMLInputElement;
const cells = () => Array.from(screen.getByTestId('otp-cells').children).map((c) => c.textContent);
const submitButton = () => screen.getByRole('button', { name: /Vérifier et créer mon compte|Vérification/ });

beforeEach(() => {
  useAuth.setState({ user: null, token: null });
  useSignup.setState({ fields: { firstName: '', lastName: '', email: '', phone: '' }, password: '', pending: false, retour: '/' });
  // auth-service : « 000000 » est refusé, tout autre code ouvre la session
  vi.spyOn(apiService.signup, 'verify').mockImplementation(async (_phone, code) => {
    if (code === '000000') throw new OtpError('invalid');
    return SESSION;
  });
  vi.spyOn(apiService.signup, 'resend').mockResolvedValue();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('OtpVerificationPage', () => {
  it("redirige vers /inscription sans inscription en cours", () => {
    renderPage();
    expect(screen.getByText("Formulaire d'inscription")).toBeInTheDocument();
  });

  it("indique l'e-mail et un seul champ accessible, focalisé", () => {
    startSignup();
    renderPage();
    expect(screen.getByText(DRAFT.email)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(input()).toHaveFocus();
    expect(input()).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input()).toHaveAttribute('inputmode', 'numeric');
    expect(input()).toHaveAttribute('maxlength', '6');
  });

  it('filtre la saisie et active le bouton à six chiffres', async () => {
    startSignup();
    const user = userEvent.setup();
    renderPage();

    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');
    await user.type(input(), '1a2-3');
    expect(input()).toHaveValue('123');
    expect(cells()).toEqual(['1', '2', '3', '', '', '']);
    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');

    await user.type(input(), '456');
    expect(cells()).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
  });

  it('accepte le collage d’un code mis en forme', async () => {
    startSignup();
    const user = userEvent.setup();
    renderPage();
    input().focus();
    await user.paste('123 456');
    expect(input()).toHaveValue('123456');
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
  });

  it('signale un code incorrect puis efface l’erreur à la saisie suivante', async () => {
    startSignup();
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '000000');
    await user.click(submitButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Code incorrect. Vérifiez l’e-mail reçu et réessayez.');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAttribute('aria-describedby', alert.id);

    await user.type(input(), '{Backspace}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('affiche le message précis du serveur (tentatives restantes)', async () => {
    startSignup();
    vi.spyOn(apiService.signup, 'verify').mockRejectedValue(new OtpError('invalid', 'Code incorrect (2 tentative(s) restante(s))'));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '123456');
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Code incorrect (2 tentative(s) restante(s))');
  });

  it('ouvre la session (JWT compris) et renvoie vers la page d’origine', async () => {
    startSignup('/billets');
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '482193');
    await user.click(submitButton());

    expect(await screen.findByText('Mes billets')).toBeInTheDocument();
    expect(useAuth.getState()).toMatchObject({ user: { firstName: 'Alida', phone: PHONE }, token: 'jwt-abc' });
    expect(useSignup.getState().pending).toBe(false);
  });

  it('affiche l’état de chargement pendant la vérification', async () => {
    startSignup();
    let resolve!: (v: Session) => void;
    vi.spyOn(apiService.signup, 'verify').mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '123456');
    await user.click(submitButton());
    expect(submitButton()).toHaveTextContent('Vérification…');
    expect(submitButton()).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve(SESSION));
  });

  it('décompte le renvoi à la seconde puis relance 30 s', async () => {
    startSignup();
    vi.useFakeTimers({ shouldAdvanceTime: false });
    renderPage();

    expect(screen.getByText('Renvoyer le code dans 0:30')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('Renvoyer le code dans 0:29')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(29000); });
    const button = screen.getByRole('button', { name: 'Renvoyer le code' });

    await act(async () => {
      button.click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(apiService.signup.resend).toHaveBeenCalledWith(PHONE);
    expect(screen.getByText('Renvoyer le code dans 0:30')).toBeInTheDocument();
  });

  it('rend le renvoi disponible immédiatement si le code a expiré', async () => {
    startSignup();
    vi.spyOn(apiService.signup, 'verify').mockRejectedValue(new OtpError('expired'));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '123456');
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce code a expiré. Demandez-en un nouveau.');
    expect(screen.getByRole('button', { name: 'Renvoyer le code' })).toBeInTheDocument();
  });

  it('bloque la saisie après trop de tentatives', async () => {
    startSignup();
    vi.spyOn(apiService.signup, 'verify').mockRejectedValue(new OtpError('too_many'));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '123456');
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de tentatives. Réessayez dans quelques minutes.');
    expect(input()).toBeDisabled();
    await waitFor(() => expect(submitButton()).toHaveAttribute('aria-disabled', 'true'));

    // Renvoi forcé : disponible tout de suite, et il débloque la saisie.
    await user.click(screen.getByRole('button', { name: 'Renvoyer le code' }));
    await waitFor(() => expect(input()).not.toBeDisabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('« Effacer » vide le code', async () => {
    startSignup();
    const user = userEvent.setup();
    renderPage();
    await user.type(input(), '12');
    await user.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(cells()).toEqual(['', '', '', '', '', '']);
    expect(input()).toHaveFocus();
  });
});
