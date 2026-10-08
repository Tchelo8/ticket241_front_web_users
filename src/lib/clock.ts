/**
 * Horloge de référence.
 *
 * Les données de démonstration (copiées du prototype) sont datées de fin août à fin
 * octobre 2026 : on les juge « passées » par rapport à une date fixe pour garder le
 * même rendu que la maquette. Une fois l'API branchée (VITE_USE_MOCKS=false), on
 * utilise la vraie date du jour.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

const MOCK_NOW = '2026-08-31T12:00:00+01:00';

/** Date utilisée pour classer les événements passés / à venir. */
export const referenceNow = () => (USE_MOCKS ? new Date(MOCK_NOW) : new Date());

/** Date affichée dans la Dateline : toujours la date du jour. */
export const today = () => new Date();

/** Nombre de jours entre maintenant et la date (arrondi au jour supérieur). */
export const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - referenceNow().getTime();
  return Math.ceil(ms / 86_400_000);
};
