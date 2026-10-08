import { Check, Plus } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './FollowButton.module.css';

/** Pastille 34px : « Suivre » (contour, Plus) ou « Suivi » (fond --accs, cyan, Check). */
export function FollowButton({ following, onToggle, name }: { following: boolean; onToggle: () => void; name: string }) {
  return (
    <button
      type="button"
      className={cx(s.btn, following && s.on)}
      aria-pressed={following}
      aria-label={following ? `Ne plus suivre ${name}` : `Suivre ${name}`}
      onClick={(e) => {
        // Ne déclenche pas la navigation de la carte.
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {/* La coche « fill » de Phosphor React est un carré plein : on garde la coche seule, en gras. */}
      {following ? <Check size={13} weight="bold" /> : <Plus size={13} />}
      {following ? 'Suivi' : 'Suivre'}
    </button>
  );
}
