const nf = new Intl.NumberFormat('fr-FR');

/** Nombre groupé à la française, espaces simples : 15000 → "15 000". */
export const groupNumber = (n: number) => nf.format(n).replace(/[  ]/g, ' ');

/** 15000 → "15 000 FCFA" */
export const fcfa = (n: number) => groupNumber(n) + ' FCFA';

/** Forme courte en liste : 15000 → "15 000 F" */
export const fcfaShort = (n: number) => groupNumber(n) + ' F';

/** "dès 15 000 FCFA" */
export const fromPrice = (n: number) => 'dès ' + fcfa(n);

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TZ = 'Africa/Libreville';

const shortDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
const longDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
const longDateYear = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const dayNum = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', timeZone: TZ });
const monShort = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: TZ });
const monthNum = new Intl.DateTimeFormat('fr-FR', { month: 'numeric', timeZone: TZ });

/** « Ven. 12 sept. » */
export const formatShortDate = (iso: string | Date) => capitalize(shortDate.format(new Date(iso)));
/** « Vendredi 12 septembre » */
export const formatLongDate = (iso: string | Date) => capitalize(longDate.format(new Date(iso)));
/** « Vendredi 12 septembre 2026 » */
export const formatLongDateYear = (iso: string | Date) => capitalize(longDateYear.format(new Date(iso)));
/** « 20:30 » */
export const formatTime = (iso: string | Date) => time.format(new Date(iso));
/** « 12 » */
export const formatDay = (iso: string | Date) => dayNum.format(new Date(iso));
/** « Sept » (sans point) */
export const formatMonthShort = (iso: string | Date) => capitalize(monShort.format(new Date(iso)).replace('.', ''));
/** Mois 1–12 dans le fuseau de Libreville. */
export const monthOf = (iso: string | Date) => Number(monthNum.format(new Date(iso)));

/** Initiales d'un nom : « Alida Nzé Mba » → « AN ». */
export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '—';

/** Décompte « 1:27 ». */
export const formatCountdown = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

/** Numéro local : garde les chiffres. */
export const phoneDigits = (s: string) => s.replace(/\D/g, '');
