import { Minus, Plus } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './QtyStepper.module.css';

/** − / chiffre / + : − en contour, + en aplat cyan. */
export function QtyStepper({
  value, onChange, label, compact, max = 10,
}: { value: number; onChange: (v: number) => void; label: string; compact?: boolean; max?: number }) {
  const size = compact ? 12 : 14;
  return (
    <div className={cx(s.root, compact && s.compact)} role="group" aria-label={`Quantité : ${label}`}>
      <button
        type="button"
        className={cx(s.btn, s.minus)}
        aria-label={`Retirer un billet ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus size={size} />
      </button>
      <span className={s.value} aria-live="polite">{value}</span>
      <button
        type="button"
        className={cx(s.btn, s.plus)}
        aria-label={`Ajouter un billet ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={size} />
      </button>
    </div>
  );
}
