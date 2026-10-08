import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './Chip.module.css';

/** Pastille de filtre ; active → fond --ink, texte --bg. */
export function Chip({
  active, onClick, icon, children, small,
}: { active: boolean; onClick: () => void; icon?: ReactNode; children: ReactNode; small?: boolean }) {
  return (
    <button type="button" aria-pressed={active} className={cx(s.chip, small && s.sm, active && s.active)} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

/** Filtre actif : fond --accs, filet et texte cyan, croix. */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" className={s.removable} onClick={onRemove} aria-label={`Retirer le filtre ${label}`}>
      {label}
      <X size={12} />
    </button>
  );
}
