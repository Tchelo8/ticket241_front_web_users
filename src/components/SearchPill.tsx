import { useId, type CSSProperties } from 'react';
import { MagnifyingGlass, XCircle } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './SearchPill.module.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Libellé lu par les lecteurs d'écran. */
  label?: string;
  /** 52px (défaut, texte 15,5px), `md` 52px texte 16px, `lg` 56px. */
  size?: 'sm' | 'md' | 'lg';
  /** Affiche une croix d'effacement quand le champ est rempli. */
  clearable?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Champ de recherche en pastille : --card, filet --line2, ombre --sh, loupe à gauche. */
export function SearchPill({ value, onChange, placeholder, label = 'Rechercher', size = 'sm', clearable, className, style }: Props) {
  const id = useId();
  return (
    <div className={cx(s.pill, size === 'lg' && s.lg, size === 'md' && s.md, className)} style={style} role="search">
      <MagnifyingGlass size={size === 'sm' ? 19 : 20} className={s.icon} aria-hidden />
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="search"
        className={s.input}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {clearable && value && (
        <button type="button" className={s.clear} aria-label="Effacer la recherche" onClick={() => onChange('')}>
          <XCircle size={18} />
        </button>
      )}
    </div>
  );
}
