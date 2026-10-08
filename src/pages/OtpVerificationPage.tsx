import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowClockwise, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { OtpError, signupApi, type OtpErrorCode } from '../api/auth';
import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../store/auth';
import { useSignup } from '../store/signup';
import { formatCountdown } from '../lib/format';
import { cx } from '../lib/cx';
import s from './OtpVerificationPage.module.css';

export const CODE_LENGTH = 4;
export const RESEND_DELAY_S = 30;

type ErrorKind = OtpErrorCode | 'network';

const MESSAGES: Record<ErrorKind, string> = {
  invalid: 'Code incorrect. Vérifiez le SMS et réessayez.',
  expired: 'Ce code a expiré. Demandez-en un nouveau.',
  too_many: 'Trop de tentatives. Réessayez dans quelques minutes.',
  network: "La vérification n'a pas abouti. Vérifiez votre connexion et réessayez.",
};

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const { fields, pending, retour, finish } = useSignup();
  const signIn = useAuth((st) => st.signIn);
  const inputId = useId();
  const errorId = inputId + '-err';
  const containerRef = useRef<HTMLFormElement>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState<ErrorKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState('');
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_DELAY_S * 1000);
  const [now, setNow] = useState(() => Date.now());

  // Décompte du renvoi, à la seconde.
  useEffect(() => {
    if (Date.now() >= resendAt) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= resendAt) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [resendAt]);

  if (!pending) return <Navigate to="/inscription" replace />;

  const locked = error === 'too_many';
  const complete = code.length === CODE_LENGTH;
  const canSubmit = complete && !busy && !locked;
  const waitS = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const focusInput = () => containerRef.current?.querySelector<HTMLInputElement>('input')?.focus();

  const change = (digits: string) => {
    setCode(digits);
    if (error && error !== 'too_many') setError(null);
    setInfo('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setInfo('');
    try {
      const user = await signupApi.verify(fields.phone, code);
      signIn(user);
      const target = retour;
      finish();
      navigate(target, { replace: true });
    } catch (err) {
      const kind: ErrorKind = err instanceof OtpError ? err.code : 'network';
      setError(kind);
      // Code expiré : le renvoi devient disponible immédiatement.
      if (kind === 'expired') {
        setResendAt(Date.now());
        setNow(Date.now());
      }
      setBusy(false);
      // Le champ était désactivé pendant l'appel : on lui rend le focus pour corriger.
      if (kind !== 'too_many') requestAnimationFrame(focusInput);
    }
  };

  const resend = async () => {
    if (waitS > 0 || resending || locked) return;
    setResending(true);
    try {
      await signupApi.resend(fields.phone);
      setCode('');
      if (error === 'expired' || error === 'invalid') setError(null);
      setInfo('Un nouveau code vient de vous être envoyé.');
      const t = Date.now();
      setResendAt(t + RESEND_DELAY_S * 1000);
      setNow(t);
      focusInput();
    } catch {
      setError('network');
    } finally {
      setResending(false);
    }
  };

  const clear = () => {
    setCode('');
    if (!locked) setError(null);
    focusInput();
  };

  return (
    <main className={s.main}>
      <div className={s.top}>
        <Link to="/inscription" className="back-link"><ArrowLeft size={17} />Modifier mes informations</Link>
        <div className={s.steps}>
          Étape 2 sur 2
          <span className={s.bars} aria-hidden><span className={s.bar} /><span className={s.bar} /></span>
        </div>
      </div>

      <div className={s.kicker}>Vérification</div>
      <h1 className={s.title}>Le code, s'il vous plaît.</h1>
      <p className={s.lead}>
        Envoyé par SMS au <b>+241 {fields.phone}</b>. Il expire dans 10 minutes.
      </p>

      <form ref={containerRef} onSubmit={submit} noValidate>
        <label htmlFor={inputId} className={s.label}>Code à quatre chiffres</label>
        <OtpInput
          id={inputId}
          value={code}
          onChange={change}
          length={CODE_LENGTH}
          error={error === 'invalid'}
          disabled={locked || busy}
          describedBy={error ? errorId : undefined}
          autoFocus
        />
        {error && (
          <div id={errorId} className={s.error} role="alert">
            <WarningCircle size={18} />
            <span>{MESSAGES[error]}</span>
          </div>
        )}

        <div className={s.row}>
          {locked ? (
            <span />
          ) : waitS > 0 ? (
            <span className={s.wait} aria-live="off">Renvoyer le code dans {formatCountdown(waitS)}</span>
          ) : (
            <button type="button" className={cx('link-btn', s.resend)} onClick={resend} disabled={resending}>
              <ArrowClockwise size={16} weight="duotone" />
              {resending ? 'Envoi…' : 'Renvoyer le code'}
            </button>
          )}
          <button type="button" className={s.clear} onClick={clear} disabled={!code || busy || locked}>Effacer</button>
        </div>
        {info && <div className={s.info} role="status">{info}</div>}

        <button
          type="submit"
          className={`btn btn--primary btn--block ${s.submit}`}
          aria-disabled={!complete || locked || undefined}
          aria-busy={busy || undefined}
        >
          {busy ? (
            <>
              <span className={s.spinner} aria-hidden />
              Vérification…
            </>
          ) : (
            'Vérifier et créer mon compte'
          )}
        </button>
      </form>
    </main>
  );
}
