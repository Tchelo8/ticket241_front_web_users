import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { ApiError, apiService, type GuestSession } from '../api/apiService';
import { OtpInput } from '../components/OtpInput';
import { TextField } from '../components/TextField';
import { TicketPass } from '../components/TicketPass';
import { phoneDigits } from '../lib/format';
import s from './TicketPage.module.css';

const CODE_LENGTH = 6;

const errorMessage = (err: unknown) =>
  err instanceof ApiError && err.serverMessage && err.status < 500
    ? err.serverMessage
    : "La demande n'a pas abouti. Vérifiez votre connexion et réessayez.";

/**
 * Billets achetés sans compte, retrouvés avec le numéro : un code part à l'e-mail donné lors
 * d'un achat payé, et ouvre une session de 30 minutes (gardée en mémoire, jamais stockée).
 */
export function RecoverTicketsPage() {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState('');
  const [code, setCode] = useState('');
  const [session, setSession] = useState<GuestSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['guest-session-tickets', session?.sessionToken],
    queryFn: () => apiService.guestAccess.tickets(session!.sessionToken),
    enabled: !!session,
  });

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (phoneDigits(phone).length < 8 || busy) return;
    setBusy(true);
    setError('');
    try {
      setSent(await apiService.guestAccess.requestCode(phone));
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError('');
    try {
      setSession(await apiService.guestAccess.verify(phone, code));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container container--sm">
      <Link to="/billets" className={`back-link ${s.back}`}><ArrowLeft size={17} />Mes billets</Link>
      <h1 className="screen-title">Retrouver mes billets</h1>

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 8, color: 'var(--acc2)', marginTop: 12 }}>
          <WarningCircle size={20} />{error}
        </div>
      )}

      {!session && (
        <>
          <p style={{ color: 'var(--ink2)' }}>
            Pour vos achats sans compte : saisissez le numéro utilisé pour payer. Un code vous est envoyé à l'e-mail donné lors de l'achat.
          </p>
          <form onSubmit={requestCode} style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 16 }}>
            <TextField label="Numéro de téléphone" phone value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="074 12 34 56" />
            <button type="submit" className="btn btn--primary" disabled={busy || phoneDigits(phone).length < 8}>
              {sent ? 'Renvoyer un code' : 'Recevoir un code'}
            </button>
          </form>

          {sent && (
            <form onSubmit={verify} style={{ display: 'grid', gap: 12, maxWidth: 420, marginTop: 24 }}>
              <p role="status">{sent}</p>
              <OtpInput id="recover-code" value={code} onChange={setCode} length={CODE_LENGTH} autoFocus />
              <button type="submit" className="btn btn--primary" disabled={busy || code.length !== CODE_LENGTH}>
                Voir mes billets
              </button>
            </form>
          )}
        </>
      )}

      {session && (
        <section style={{ marginTop: 16 }}>
          <p style={{ color: 'var(--ink2)' }}>Accès ouvert pendant 30 minutes. Téléchargez vos billets pour les garder.</p>
          {isLoading && <p>Chargement…</p>}
          {tickets?.length === 0 && <p>Aucun billet payé pour ce numéro.</p>}
          {tickets?.map((t) => (
            <TicketPass key={t.ref} ticket={t} download={() => apiService.guestAccess.downloadPdf(session.sessionToken, t.ref)} />
          ))}
        </section>
      )}
    </main>
  );
}
