import { Heart } from '@phosphor-icons/react';
import { usePrefs } from '../store/prefs';
import { cx } from '../lib/cx';
import s from './FavButton.module.css';

/** Cercle blanc 36px avec ombre et cœur ; actif → cœur plein cyan. */
export function FavButton({ eventId, name, large }: { eventId: string; name: string; large?: boolean }) {
  const on = usePrefs((st) => st.favIds.includes(eventId));
  const toggle = usePrefs((st) => st.toggleFav);
  return (
    <button
      type="button"
      className={cx(s.btn, on && s.on, large && s.lg)}
      aria-label={on ? `Retirer « ${name} » des favoris` : `Ajouter « ${name} » aux favoris`}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(eventId);
      }}
    >
      <Heart size={large ? 19 : 18} weight={on ? 'fill' : 'duotone'} />
    </button>
  );
}
