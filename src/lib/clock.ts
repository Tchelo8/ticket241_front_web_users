/**
 * Horloge de référence.
 *
 * Les données de démonstration (copiées du prototype) sont datées de fin août à fin
 * octobre 2026 : on les juge « passées » par rapport à une date fixe pour garder le
 * même rendu que la maquette. Une fois les événements branchés sur l'API réelle,
 * on utilise la vraie date du jour.
 */
import { isLive } from './apiMode';

const MOCK_NOW = '2026-08-31T12:00:00+01:00';

/** Date utilisée pour classer les événements passés / à venir. */
export const referenceNow = () => (isLive('events') ? new Date() : new Date(MOCK_NOW));

/** Date affichée dans la Dateline : toujours la date du jour. */
export const today = () => new Date();

/** Nombre de jours entre maintenant et la date (arrondi au jour supérieur). */
export const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - referenceNow().getTime();
  return Math.ceil(ms / 86_400_000);
};
