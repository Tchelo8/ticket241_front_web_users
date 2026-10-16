import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeSlash, LockKey, UserPlus } from '@phosphor-icons/react';
import { ApiError, apiService } from '../api/apiService';
import { TextField } from '../components/TextField';
import { useAuth } from '../store/auth';
import s from './AuthPages.module.css';

/** N'accepte que les chemins internes pour éviter les redirections ouvertes. */
export const safeReturn = (r: string | null) => (r && r.startsWith('/') && !r.startsWith('//') ? r : '/');

/** Message affiché sous le formulaire selon la réponse de l'auth-service. */
export const loginErrorMessage = (err: unknown): string => {
  if (!(err instanceof ApiError)) return 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
  if (err.fields) return '';
  if (err.status === 401) return err.serverMessage ?? 'Numéro de téléphone ou mot de passe incorrect';
  // Le message du serveur cite une route d'API : on le reformule pour l'utilisateur.
  if (err.status === 403) {
    // 403 : compte suspendu ou supprimé (message du serveur, affiché tel quel), ou pas encore vérifié
    if (err.serverMessage && /suspendu|supprim/i.test(err.serverMessage)) return err.serverMessage;
    return "Votre compte n'est pas encore vérifié. Saisissez le code reçu par e-mail pour l'activer.";
  }
  return 'Une erreur est survenue, réessayez plus tard.';
};

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const retour = safeReturn(params.get('retour'));
  const signIn = useAuth((st) => st.signIn);
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [shown, setShown] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    // Mêmes règles que le serveur : on évite l'aller-retour pour un champ vide.
    const missing = {
      phone: phone.trim() ? undefined : 'Le numéro de téléphone est requis',
      password: pwd ? undefined : 'Le mot de passe est requis',
    };
    setFieldErrors(missing);
    if (missing.phone || missing.password) return;
    setBusy(true);
    try {
      const { user, token } = await apiService.auth.login(phone.trim(), pwd);
      signIn(user, token);
      navigate(retour, { replace: true });
    } catch (err) {
      setError(loginErrorMessage(err));
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
    } finally {
      setBusy(false);
    }
  };

  const signupHref = retour !== '/' ? `/inscription?retour=${encodeURIComponent(retour)}` : '/inscription';

  return (
    <main className={s.login}>
      <div className={s.visual}>
        <img src="/images/jazz.png" alt="" className="evimg" />
        <div className={s.visualShade} />
        <div className={s.visualText}>
          <div className={s.visualKicker}>La billetterie du Gabon</div>
          <div className={s.visualTitle}>Tout ce qui se joue, de Libreville à Franceville.</div>
        </div>
      </div>
      <form className={s.formCol} onSubmit={submit} noValidate>
        <div className={s.kicker}>Connexion</div>
        <h1 className={s.title}>Bonsoir.</h1>
        <p className={s.lead}>Votre numéro et votre mot de passe suffisent.</p>
        <TextField
          className={s.mt30}
          label="Numéro de téléphone"
          labelStyle="caps"
          height={56}
          phone
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="074 12 34 56"
          autoComplete="username"
          error={fieldErrors.phone || !!error}
        />
        <TextField
          className={s.mt16}
          label="Mot de passe"
          labelStyle="caps"
          height={56}
          icon={<LockKey size={19} />}
          type={shown ? 'text' : 'password'}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          error={fieldErrors.password || error || undefined}
          trailing={
            <button type="button" className={s.eye} aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShown((v) => !v)}>
              {shown ? <EyeSlash size={19} /> : <Eye size={19} />}
            </button>
          }
        />
        <div className={s.forgot}><a href="#mot-de-passe-oublie">Mot de passe oublié ?</a></div>
        <button type="submit" className={`btn btn--primary btn--block ${s.submit}`} aria-busy={busy || undefined}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
        <div className={s.or} aria-hidden><span /><span className={s.orText}>ou</span><span /></div>
        <Link to={signupHref} className={`btn btn--outline btn--block ${s.signupBtn}`}>
          <UserPlus size={19} />S'inscrire
        </Link>
      </form>
    </main>
  );
}
