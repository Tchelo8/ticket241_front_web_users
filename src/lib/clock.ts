/** Horloge de référence : la vraie date du jour. */

/** Date utilisée pour classer les événements passés / à venir. */
export const referenceNow = () => new Date();

/** Date affichée dans la Dateline. */
export const today = () => new Date();

/** Nombre de jours entre maintenant et la date (arrondi au jour supérieur). */
export const daysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - referenceNow().getTime();
  return Math.ceil(ms / 86_400_000);
};
