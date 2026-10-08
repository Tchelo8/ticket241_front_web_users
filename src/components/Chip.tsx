import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './Chip.module.css';

type ChipProps = {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  /** `sm` : 13px (filtres « Quand ») · `md` : 13,5px (thèmes de la FAQ) · défaut : 14px. */
  size?: 'sm' | 'md';
  /** @deprecated utiliser `size="sm"` */
  small?: boolean;
  /** Compteur optionnel, 12px à 65 % d'opacité. */
  count?: number;
};

/** Pastille de filtre ; active → fond --ink, texte --bg. */
export function Chip({ active, onClick, icon, children, small, size, count }: ChipProps) {
  const sz = size ?? (small ? 'sm' : undefined);
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(s.chip, sz === 'sm' && s.sm, sz === 'md' && s.md, count !== undefined && s.withCount, active && s.active)}
      onClick={onClick}
    >
      {icon}
      {children}
      {count !== undefined && <span className={s.count}>{count}</span>}
    </button>
  );
}

/** Pastille de filtre avec compteur (annuaire, FAQ). */
export const FilterChip = Chip;

/** Filtre actif : fond --accs, filet et texte cyan, croix. */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className={s.removable} onClick={onRemove} aria-label={`Retirer le filtre ${label}`}>
      {label}
      <X size={12} />
    </button>
  );
}
