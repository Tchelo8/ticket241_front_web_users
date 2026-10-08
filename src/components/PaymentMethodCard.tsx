import { Check, CreditCard } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './PaymentMethodCard.module.css';

type Props = {
  name: string;
  note: string;
  tint: string;
  logo?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

/** Carte de moyen de paiement : sélection → bordure 2px à la teinte, halo, coche en `pop`. */
export function PaymentMethodCard({ name, note, tint, logo, selected, disabled, onSelect }: Props) {
  const on = selected && !disabled;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-disabled={disabled || undefined}
      className={cx(s.card, disabled && s.disabled)}
      style={on ? { borderColor: tint, boxShadow: `0 0 0 4px ${tint}22` } : undefined}
      onClick={() => !disabled && onSelect()}
    >
      <span className={s.logo}>
        {logo ? <img src={logo} alt="" className="evimg" /> : <CreditCard size={24} />}
      </span>
      <span>
        <span className={s.name} style={{ display: 'block' }}>{name}</span>
        <span className={s.note} style={{ display: 'block' }}>{note}</span>
      </span>
      {on && (
        <span className={s.check} style={{ background: tint }} aria-hidden>
          <Check size={14} weight="bold" />
        </span>
      )}
    </button>
  );
}
