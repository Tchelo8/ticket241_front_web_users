import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alarm, Bell, CaretDown, DeviceMobile, EnvelopeSimple, LockSimple, MapPin, PaintBrush, SignOut, User } from '@phosphor-icons/react';
import { apiService } from '../api/apiService';
import { useTickets } from '../api/hooks';
import { DoubleRule } from '../components/DoubleRule';
import { TextField } from '../components/TextField';
import { ThemeSwitch } from '../components/ThemeSwitch';
import { Toggle } from '../components/Toggle';
import { CITIES } from '../mocks/events';
import { fullName, useAuth } from '../store/auth';
import { useCheckout } from '../store/checkout';
import { usePrefs } from '../store/prefs';
import { initials } from '../lib/format';
import s from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuth((st) => st.user)!;
  const update = useAuth((st) => st.update);
  const signOut = useAuth((st) => st.signOut);
  const setBuyer = useCheckout((st) => st.setBuyer);
  const { city, setCity, favIds, alerts, setAlert } = usePrefs();
  const { data: tickets = [] } = useTickets();
  const [name, setName] = useState(fullName(user));
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(t);
  }, [saved]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const [firstName, ...rest] = name.trim().split(/\s+/);
    update({ firstName: firstName ?? '', lastName: rest.join(' '), email: email.trim() });
    setBuyer({ name: name.trim() });
    setSaved(true);
  };

  const doLogout = async () => {
    await apiService.auth.logout();
    signOut();
    setBuyer({ name: '', phone: '' });
    navigate('/connexion', { replace: true });
  };

  const stats = [
    { n: tickets.reduce((a, t) => a + t.quantity, 0), label: 'Billets' },
    { n: favIds.length, label: 'Favoris' },
    { n: 3, label: 'Villes' },
  ];

  const prefRows = [
    { k: 'onSale' as const, Icon: Bell, label: 'Alertes de mise en vente' },
    { k: 'reminder' as const, Icon: Alarm, label: "Rappel la veille de l'événement" },
    { k: 'newsletter' as const, Icon: EnvelopeSimple, label: 'Lettre hebdomadaire' },
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
                label="Numéro de téléphone" labelStyle="caps" icon={<DeviceMobile size={18} />} value={'+241 ' + user.phone} locked
                trailing={<LockSimple size={16} color="var(--ink3)" aria-label="Verrouillé" />}
              />
              <TextField label="Adresse e-mail" labelStyle="caps" type="email" icon={<EnvelopeSimple size={18} />} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <div>
                <label htmlFor="pref-city" className={s.selectLabel}>Ville par défaut</label>
                <div className={s.selectBox}>
                  <MapPin size={18} />
                  <select id="pref-city" className={s.select} value={city} onChange={(e) => setCity(e.target.value)}>
                    {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <CaretDown size={14} />
                </div>
              </div>
            </div>
            <div className={s.note}>
              Le numéro reçoit vos billets et vos demandes de paiement ; sa modification demande une nouvelle vérification.
            </div>
            <button type="submit" className={`btn btn--primary ${s.save}`}>Enregistrer</button>
            {saved && <span className={s.saved} role="status">Modifications enregistrées.</span>}
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
            {prefRows.map(({ k, Icon: Ico, label }) => (
              <div key={k} className={s.pref}>
                <Toggle on={alerts[k]} onChange={(v) => setAlert(k, v)}>
                  <span className={s.prefRow}>
                    <Ico size={20} />
                    <span className={s.prefLabel}>{label}</span>
                  </span>
                </Toggle>
              </div>
            ))}
          </div>
          <button type="button" className={`btn btn--danger btn--block ${s.logout}`} onClick={doLogout}>
            <SignOut size={18} />Se déconnecter
          </button>
        </section>
      </div>
    </main>
  );
}
