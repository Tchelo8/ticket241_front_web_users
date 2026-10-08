import type { ClipboardEvent, CSSProperties } from 'react';
import { cx } from '../lib/cx';
import s from './OtpInput.module.css';

type Props = {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
};

const onlyDigits = (v: string, length: number) => v.replace(/\D/g, '').slice(0, length);

/**
 * Saisie de code : cases purement visuelles, un seul <input> transparent par-dessus.
 * Le libellé (<label htmlFor={id}>) est fourni par l'écran appelant.
 */
export function OtpInput({ id, value, onChange, length = 4, error, disabled, describedBy, autoFocus }: Props) {
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    // Le collage « 12 34 » ou « 12-34 » serait tronqué par maxLength avant filtrage.
    e.preventDefault();
    onChange(onlyDigits(e.clipboardData.getData('text'), length));
  };
  return (
    <div
      className={cx(s.root, error && s.error, disabled && s.disabled)}
      style={{ '--len': length } as CSSProperties}
    >
      <div className={s.cells} aria-hidden data-testid="otp-cells">
        {Array.from({ length }, (_, i) => (
          <div key={i} className={cx(s.cell, !disabled && !error && i === value.length && s.pending)} data-pending={i === value.length || undefined}>
            {value[i] ?? ''}
          </div>
        ))}
      </div>
      <input
        id={id}
        className={s.input}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        value={value}
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(onlyDigits(e.target.value, length))}
        onPaste={onPaste}
      />
    </div>
  );
}
