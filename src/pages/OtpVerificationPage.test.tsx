import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OtpError, signupApi } from '../api/auth';
import { mockLatency, mockSignupApi, resetMockSignup } from '../api/auth.mock';
import { useAuth } from '../store/auth';
import { useSignup } from '../store/signup';
import { OtpVerificationPage } from './OtpVerificationPage';

const PHONE = '074 12 34 56';
const DRAFT = { firstName: 'Alida', lastName: 'Nzé Mba', email: 'alida.nze@example.ga', phone: PHONE };

async function startSignup(retour = '/') {
  await mockSignupApi.start({ ...DRAFT, password: 'Motdepasse1' });
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

const input = () => screen.getByLabelText('Code à quatre chiffres') as HTMLInputElement;
const cells = () => Array.from(screen.getByTestId('otp-cells').children).map((c) => c.textContent);
const submitButton = () => screen.getByRole('button', { name: /Vérifier et créer mon compte|Vérification/ });

beforeEach(() => {
  mockLatency.ms = 0;
  resetMockSignup();
  useAuth.setState({ user: null });
  useSignup.setState({ fields: { firstName: '', lastName: '', email: '', phone: '' }, password: '', pending: false, retour: '/' });
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

  it('affiche le numéro et un seul champ accessible, focalisé', async () => {
    await startSignup();
    renderPage();
    expect(screen.getByText(`+241 ${PHONE}`)).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(input()).toHaveFocus();
    expect(input()).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input()).toHaveAttribute('inputmode', 'numeric');
    expect(input()).toHaveAttribute('maxlength', '4');
  });

  it('filtre la saisie et active le bouton à quatre chiffres', async () => {
    await startSignup();
    const user = userEvent.setup();
    renderPage();

    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');
    await user.type(input(), '1a2-3');
    expect(input()).toHaveValue('123');
    expect(cells()).toEqual(['1', '2', '3', '']);
    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');

    await user.type(input(), '4');
    expect(cells()).toEqual(['1', '2', '3', '4']);
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
  });

  it('accepte le collage d’un code mis en forme', async () => {
    await startSignup();
    const user = userEvent.setup();
    renderPage();
    input().focus();
    await user.paste('12 34');
    expect(input()).toHaveValue('1234');
    expect(cells()).toEqual(['1', '2', '3', '4']);
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
  });

  it('signale un code incorrect puis efface l’erreur à la saisie suivante', async () => {
    await startSignup();
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '0000');
    await user.click(submitButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Code incorrect. Vérifiez le SMS et réessayez.');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAttribute('aria-describedby', alert.id);

    await user.type(input(), '{Backspace}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-invalid');
  });

  it('ouvre la session et renvoie vers la page d’origine', async () => {
    await startSignup('/billets');
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '4821');
    await user.click(submitButton());

    expect(await screen.findByText('Mes billets')).toBeInTheDocument();
    expect(useAuth.getState().user).toMatchObject({ firstName: 'Alida', phone: PHONE });
    expect(useSignup.getState().pending).toBe(false);
  });

  it('affiche l’état de chargement pendant la vérification', async () => {
    await startSignup();
    let resolve!: (v: Awaited<ReturnType<typeof signupApi.verify>>) => void;
    vi.spyOn(signupApi, 'verify').mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '1234');
    await user.click(submitButton());
    expect(submitButton()).toHaveTextContent('Vérification…');
    expect(submitButton()).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve({ ...DRAFT }));
  });

  it('décompte le renvoi à la seconde puis relance 30 s', async () => {
    await startSignup();
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const resend = vi.spyOn(signupApi, 'resend');
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
    expect(resend).toHaveBeenCalledWith(PHONE);
    expect(screen.getByText('Renvoyer le code dans 0:30')).toBeInTheDocument();
  });

  it('rend le renvoi disponible immédiatement si le code a expiré', async () => {
    await startSignup();
    vi.spyOn(signupApi, 'verify').mockRejectedValue(new OtpError('expired'));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '1234');
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce code a expiré. Demandez-en un nouveau.');
    expect(screen.getByRole('button', { name: 'Renvoyer le code' })).toBeInTheDocument();
  });

  it('bloque la saisie après trop de tentatives', async () => {
    await startSignup();
    vi.spyOn(signupApi, 'verify').mockRejectedValue(new OtpError('too_many'));
    const user = userEvent.setup();
    renderPage();

    await user.type(input(), '1234');
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
    await startSignup();
    const user = userEvent.setup();
    renderPage();
    await user.type(input(), '12');
    await user.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(cells()).toEqual(['', '', '', '']);
    expect(input()).toHaveFocus();
  });
});
