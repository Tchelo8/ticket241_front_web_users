import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alarm, CaretDown, DeviceMobile, EnvelopeSimple, LockKey, LockSimple, MapPin, Megaphone, PaintBrush, SignOut, Ticket as TicketIcon, Trash, User } from '@phosphor-icons/react';
import { ApiError, apiService, type EmailAlerts } from '../api/apiService';
import { useCities, useFavorites, useTickets } from '../api/hooks';
import { DoubleRule } from '../components/DoubleRule';
import { TextField } from '../components/TextField';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { Toggle } from '../components/Toggle';
import { isValidTicket } from '../components/TicketPass';
import { fullName, useAuth } from '../store/auth';
import { useCheckout } from '../store/checkout';
import { usePrefs } from '../store/prefs';
import { initials } from '../lib/format';
import s from './ProfilePage.module.css';

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.fields
    ? Object.values(err.fields)[0] ?? fallback
    : err instanceof ApiError && err.serverMessage && err.status < 500
      ? err.serverMessage
      : fallback;

export function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuth((st) => st.user)!;
  const update = useAuth((st) => st.update);
  const signOut = useAuth((st) => st.signOut);
  const setBuyer = useCheckout((st) => st.setBuyer);
  const { city, setCity } = usePrefs();
  const { ids: favIds } = useFavorites();
  const { data: tickets = [] } = useTickets();
  const { data: cities = [] } = useCities();
  const [name, setName] = useState(fullName(user));
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Alertes e-mail : enregistrées par notification-service
  const alerts = useQuery({ queryKey: ['email-alerts'], queryFn: () => apiService.preferences.get() });
  const setAlert = useMutation({
    mutationFn: (p: Partial<EmailAlerts>) => apiService.preferences.update(p),
    onSuccess: (data) => qc.setQueryData(['email-alerts'], data),
  });

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const [firstName, ...rest] = name.trim().split(/\s+/);
    if (!firstName || !rest.length) {
      setSaveError('Indiquez votre prénom et votre nom.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await apiService.auth.updateProfile(firstName, rest.join(' '));
      update({ firstName: updated.firstName, lastName: updated.lastName });
      setBuyer({ name: fullName(updated) });
      setSaved(true);
    } catch (err) {
      setSaveError(errorText(err, "L'enregistrement a échoué, réessayez."));
    } finally {
      setSaving(false);
    }
  };

  const doLogout = async () => {
    await apiService.auth.logout();
    signOut();
    setBuyer({ name: '', phone: '', email: '' });
    navigate('/connexion', { replace: true });
  };

  const deleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiService.auth.deleteAccount(password);
      signOut();
      setBuyer({ name: '', phone: '', email: '' });
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(errorText(err, 'La suppression a échoué, réessayez.'));
    } finally {
      setDeleting(false);
    }
  };

  const valid = tickets.filter(isValidTicket);
  const stats = [
    { n: valid.length, label: 'Billets' },
    { n: favIds.length, label: 'Favoris' },
    { n: new Set(valid.map((t) => t.city).filter(Boolean)).size, label: 'Villes' },
  ];

  const prefRows: { k: keyof EmailAlerts; Icon: typeof Alarm; label: string }[] = [
    { k: 'ticketUpdates', Icon: TicketIcon, label: 'Mes billets par e-mail' },
    { k: 'eventReminders', Icon: Alarm, label: "Rappel avant l'événement" },
    { k: 'promotions', Icon: Megaphone, label: 'Nouveautés et offres' },
  ];

  return (
    <main className="container container--profile">
      <div className={s.top}>
        <div className={s.avatar} aria-hidden>{initials(fullName(user))}</div>
        <div className={s.who}>
          <h1 className={s.name}>{fullName(user)}</h1>
          <div className={s.phone}>+241 {user.phone}</div>
        </div>
        <dl className={s.stats} style={{ margin: 0 }}>
          {stats.map((st) => (
            <div key={st.label} className={s.stat}>
              <dd className={s.statN} style={{ margin: 0 }}>{st.n}</dd>
              <dt className={s.statL}>{st.label}</dt>
            </div>
          ))}
        </dl>
      </div>
      <DoubleRule style={{ marginTop: 26 }} />

      <div className={s.cols}>
        <section className={s.colMain} aria-labelledby="h-perso">
          <h2 className={s.h2} id="h-perso">Informations personnelles</h2>
          <form onSubmit={save}>
            <div className={s.fields}>
              <TextField label="Nom complet" labelStyle="caps" icon={<User size={18} />} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <TextField
                label="Numéro de téléphone" labelStyle="caps" icon={<DeviceMobile size={18} />} value={'+241 ' + user.phone} locked readOnly
                trailing={<LockSimple size={16} color="var(--ink3)" aria-label="Verrouillé" />}
              />
              <TextField
                label="Adresse e-mail" labelStyle="caps" type="email" icon={<EnvelopeSimple size={18} />} value={user.email} locked readOnly
                trailing={<LockSimple size={16} color="var(--ink3)" aria-label="Verrouillé" />}
              />
              <div>
                <label htmlFor="pref-city" className={s.selectLabel}>Ville par défaut</label>
                <div className={s.selectBox}>
                  <MapPin size={18} />
                  <select id="pref-city" className={s.select} value={city} onChange={(e) => setCity(e.target.value)}>
                    {!cities.some((c) => c.name === city) && <option value={city}>{city}</option>}
                    {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <CaretDown size={14} />
                </div>
              </div>
            </div>
            <div className={s.note}>
              Le numéro et l'e-mail servent à vous connecter et à recevoir vos codes : pour les changer, contactez le support.
            </div>
            <button type="submit" className={`btn btn--primary ${s.save}`} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {saved && <span className={s.saved} role="status">Modifications enregistrées.</span>}
            {saveError && <div className={s.note} role="alert">{saveError}</div>}
          </form>
        </section>

        <section className={s.colSide} aria-labelledby="h-prefs">
          <h2 className={s.h2} id="h-prefs">Préférences</h2>
          <div className={s.prefs}>
            <div className={s.pref}>
              <PaintBrush size={20} />
              <span className={s.prefLabel}>Apparence</span>
              <ThemeSwitch />
            </div>
            {alerts.data &&
              prefRows.map(({ k, Icon: Ico, label }) => (
                <div key={k} className={s.pref}>
                  <Toggle on={alerts.data[k]} onChange={(v) => setAlert.mutate({ [k]: v })}>
                    <span className={s.prefRow}>
                      <Ico size={20} />
                      <span className={s.prefLabel}>{label}</span>
                    </span>
                  </Toggle>
                </div>
              ))}
            {alerts.isError && <div className={s.pref}>Alertes e-mail momentanément indisponibles.</div>}
          </div>
          {setAlert.isError && <div className={s.note} role="alert">La préférence n'a pas été enregistrée, réessayez.</div>}
          <button type="button" className={`btn btn--danger btn--block ${s.logout}`} onClick={doLogout}>
            <SignOut size={18} />Se déconnecter
          </button>

          <h2 className={s.h2} style={{ marginTop: 32 }}>Supprimer mon compte</h2>
          {!deleteOpen ? (
            <>
              <div className={s.note}>
                Vos billets déjà payés restent valables. Le compte pourra être réactivé par le support Ticket241.
              </div>
              <button type="button" className={`btn btn--outline btn--block ${s.logout}`} onClick={() => setDeleteOpen(true)}>
                <Trash size={18} />Supprimer mon compte
              </button>
            </>
          ) : (
            <form onSubmit={deleteAccount}>
              <div className={s.note}>Confirmez avec votre mot de passe.</div>
              <TextField
                label="Mot de passe" type="password" icon={<LockKey size={18} />} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              />
              {deleteError && <div className={s.note} role="alert">{deleteError}</div>}
              <button type="submit" className={`btn btn--danger btn--block ${s.logout}`} disabled={!password || deleting}>
                {deleting ? 'Suppression…' : 'Supprimer définitivement mon accès'}
              </button>
              <button type="button" className={`btn btn--outline btn--block ${s.logout}`} onClick={() => setDeleteOpen(false)}>
                Annuler
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
