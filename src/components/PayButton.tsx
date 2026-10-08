import { LockSimple } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './PayButton.module.css';

export type PayButtonState = 'idle' | 'disabled' | 'loading';

/** Bouton de paiement : `idle` / `disabled` / `loading`. */
export function PayButton({
  state, amountLabel, providerName, onClick, describedBy,
}: { state: PayButtonState; amountLabel: string; providerName: string; onClick: () => void; describedBy?: string }) {
  return (
    <button
      type="button"
      className={cx(s.btn, state === 'disabled' && s.disabled, state === 'loading' && s.loading)}
      aria-disabled={state !== 'idle' || undefined}
      aria-busy={state === 'loading' || undefined}
      aria-describedby={describedBy}
      onClick={() => state === 'idle' && onClick()}
    >
      {state === 'loading' ? (
        <span className={s.label} role="status">
          <span className={s.spinner} aria-hidden />
          Connexion à {providerName}…
        </span>
      ) : (
        <span className={s.label}>
          <LockSimple size={18} />
          Payer {amountLabel}
        </span>
      )}
    </button>
  );
}
