import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, EnvelopeSimple, LockKey } from '@phosphor-icons/react';
import { signupApi } from '../api/auth';
import { Logo } from '../components/Logo';
import { TextField } from '../components/TextField';
import { useSignup } from '../store/signup';
import { phoneDigits } from '../lib/format';
import { safeReturn } from './LoginPage';
import s from './AuthPages.module.css';

/** 1 point chacun : ≥ 8 caractères, majuscule, chiffre ou symbole. */
export const passwordScore = (p: string) =>
  Number(p.length >= 8) + Number(/[A-Z]/.test(p)) + Number(/[0-9!@#$%^&*]/.test(p));

const STRENGTH = [
  { label: 'Trop faible', color: 'var(--acc2)', width: '0%' },
  { label: 'Trop faible', color: 'var(--acc2)', width: '33%' },
  { label: 'Correct', color: 'var(--ink2)', width: '67%' },
  { label: 'Solide', color: 'var(--acc)', width: '100%' },
];

export function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Champs conservés dans le store d'inscription : on les retrouve en revenant de la vérification.
  const { fields, password, setFields, setPassword, begin } = useSignup();
  const f = { ...fields, password };
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    k === 'password' ? setPassword(e.target.value) : setFields({ [k]: e.target.value });

  const score = passwordScore(f.password);
  const strength = STRENGTH[score];
  const ok = !!(f.firstName.trim() && f.lastName.trim() && f.email.includes('@') && phoneDigits(f.phone).length >= 8 && f.password.length >= 8 && terms);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true);
    setError('');
    const clean = { firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim() };
    try {
      // POST /auth/signup/start : le code part par SMS, le compte sera créé après vérification.
      await signupApi.start({ ...clean, password: f.password });
      setFields(clean);
      begin(safeReturn(params.get('retour')));
      navigate('/inscription/verification');
    } catch {
      setError("L'envoi du code n'a pas abouti. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={s.signup}>
      <Link to="/connexion" className="back-link"><ArrowLeft size={17} />Connexion</Link>
      <div className={s.logo}><Logo height={40} /></div>
      <div className={s.kicker} style={{ marginTop: 20 }}>Inscription</div>
      <h1 className={`${s.title} ${s.signupTitle}`}>Créons votre compte.</h1>
      <p className={s.lead}>Quelques informations et vos billets vous suivent partout.</p>
      <form onSubmit={submit} noValidate>
        <div className={s.names}>
          <TextField label="Prénom" labelStyle="caps" height={54} value={f.firstName} onChange={set('firstName')} placeholder="Alida" autoComplete="given-name" />
          <TextField label="Nom" labelStyle="caps" height={54} value={f.lastName} onChange={set('lastName')} placeholder="Nzé Mba" autoComplete="family-name" />
        </div>
        <TextField
          className={s.mt16} label="Adresse e-mail" labelStyle="caps" height={54} type="email"
          icon={<EnvelopeSimple size={18} />} value={f.email} onChange={set('email')} placeholder="alida.nze@example.ga" autoComplete="email"
        />
        <TextField
          className={s.mt16} label="Numéro de téléphone" labelStyle="caps" height={54} phone
          value={f.phone} onChange={set('phone')} placeholder="074 12 34 56"
          hint="Ce numéro recevra vos billets et vos demandes de paiement."
        />
        <TextField
          className={s.mt16} label="Mot de passe" labelStyle="caps" height={54} type="password"
          icon={<LockKey size={18} />} value={f.password} onChange={set('password')} placeholder="8 caractères minimum"
          autoComplete="new-password" aria-describedby="pwd-strength"
        />
        <div className={s.meter} id="pwd-strength">
          <div className={s.meterTrack} aria-hidden>
            <div className={s.meterFill} style={{ width: f.password ? strength.width : '0%', background: strength.color }} />
          </div>
          <span className={s.meterLabel} style={{ color: f.password ? strength.color : 'var(--ink3)' }} aria-live="polite">
            {f.password ? strength.label : '—'}
          </span>
        </div>
        <label className={s.check}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span className={s.box} aria-hidden><Check size={13} weight="bold" /></span>
          <span>J'accepte les conditions d'utilisation et la politique de confidentialité de Ticket241.</span>
        </label>
        <button type="submit" className={`btn btn--primary btn--block ${s.submit} ${s.submit22}`} aria-disabled={!ok || undefined}>
          {busy ? 'Envoi du code…' : 'Créer mon compte'}
        </button>
        {error && <div className={s.error} role="alert">{error}</div>}
      </form>
      <div className={s.already}>Déjà un compte ? <Link to="/connexion">Se connecter</Link></div>
    </main>
  );
}
