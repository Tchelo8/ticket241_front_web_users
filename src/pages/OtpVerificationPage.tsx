import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowClockwise, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { apiService, OtpError, type OtpErrorCode } from '../api/apiService';
import { OtpInput } from '../components/OtpInput';
import { useAuth } from '../store/auth';
import { useSignup } from '../store/signup';
import { formatCountdown } from '../lib/format';
import { cx } from '../lib/cx';
import s from './OtpVerificationPage.module.css';

/** Code envoyé par e-mail par notification-service : 6 chiffres. */
export const CODE_LENGTH = 6;
export const RESEND_DELAY_S = 30;

type ErrorKind = OtpErrorCode | 'network';

const MESSAGES: Record<ErrorKind, string> = {
  invalid: 'Code incorrect. Vérifiez l’e-mail reçu et réessayez.',
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
  // Vérification réussie : la navigation (transition React Router) peut arriver après la fin de
  // l'inscription ; on ne doit alors plus renvoyer vers le formulaire
  const leavingRef = useRef(false);

  const [code, setCode] = useState('');
  const [error, setError] = useState<ErrorKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState('');
  // Message précis du serveur (tentatives restantes…), affiché à la place du message générique
  const [serverMessage, setServerMessage] = useState('');
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

  if (!pending) return leavingRef.current ? null : <Navigate to="/inscription" replace />;

  const locked = error === 'too_many';
  const complete = code.length === CODE_LENGTH;
  const canSubmit = complete && !busy && !locked;
  const waitS = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const focusInput = () => containerRef.current?.querySelector<HTMLInputElement>('input')?.focus();

  const change = (digits: string) => {
    setCode(digits);
    if (error && error !== 'too_many') setError(null);
    setServerMessage('');
    setInfo('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setInfo('');
    try {
      const session = await apiService.signup.verify(fields.phone, code);
      signIn(session.user, session.token);
      // Naviguer AVANT de clore l'inscription : sinon la page se réaffiche sans inscription
      // en cours et renvoie vers le formulaire au lieu de la page d'origine
      leavingRef.current = true;
      navigate(retour, { replace: true });
      finish();
    } catch (err) {
      const kind: ErrorKind = err instanceof OtpError ? err.code : 'network';
      setError(kind);
      setServerMessage(err instanceof OtpError ? err.serverMessage ?? '' : '');
      // Code expiré ou trop de tentatives : renvoi forcé, disponible immédiatement.
      if (kind === 'expired' || kind === 'too_many') {
        setResendAt(Date.now());
        setNow(Date.now());
      }
      setBusy(false);
      // Le champ était désactivé pendant l'appel : on lui rend le focus pour corriger.
      if (kind !== 'too_many') requestAnimationFrame(focusInput);
    }
  };

  const resend = async () => {
    if (waitS > 0 || resending) return;
    setResending(true);
    try {
      await apiService.signup.resend(fields.phone);
      setCode('');
      // Un nouveau code lève aussi le blocage « trop de tentatives ».
      setError(null);
      setServerMessage('');
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
      <Link to="/inscription" className="back-link"><ArrowLeft size={17} />Modifier mes informations</Link>
      <div className={s.steps}>
        <span className={s.bar} aria-hidden />
        <span className={s.bar} aria-hidden />
        <span className={s.stepsLabel}>Étape 2 sur 2</span>
      </div>

      <div className={s.kicker}>Vérification</div>
      <h1 className={s.title}>Le code, s'il vous plaît.</h1>
      <p className={s.lead}>
        Envoyé par e-mail à <b>{fields.email}</b>. Il expire dans quelques minutes.
      </p>

      <form ref={containerRef} onSubmit={submit} noValidate>
        <label htmlFor={inputId} className="sr-only">Code à six chiffres</label>
        <div className={s.code}>
        <OtpInput
          id={inputId}
          value={code}
          onChange={change}
          length={CODE_LENGTH}
          error={!!error && error !== 'network'}
          disabled={locked || busy}
          describedBy={error ? errorId : undefined}
          autoFocus
        />
        </div>
        {error && (
          <div id={errorId} className={s.error} role="alert">
            <WarningCircle size={17} />
            <span>{serverMessage || MESSAGES[error]}</span>
          </div>
        )}

        <div className={s.row}>
          {waitS > 0 ? (
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
