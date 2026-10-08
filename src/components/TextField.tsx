import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import s from './TextField.module.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> & {
  label: string;
  /** Icône Phosphor placée à gauche. */
  icon?: ReactNode;
  /** Préfixe téléphonique +241. */
  phone?: boolean;
  trailing?: ReactNode;
  error?: string | boolean;
  hint?: string;
  labelStyle?: 'plain' | 'caps';
  height?: 52 | 54 | 56;
  locked?: boolean;
};

/** Champ avec icône ou préfixe +241 ; `error` → bordure --acc2. */
export function TextField({
  label, icon, phone, trailing, error, hint, labelStyle = 'plain', height = 52, locked, className, id, ...input
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? inputId + '-hint' : undefined;
  const errId = typeof error === 'string' && error ? inputId + '-err' : undefined;
  return (
    <div className={cx(s.field, className)}>
      <label htmlFor={inputId} className={cx(s.label, labelStyle === 'caps' && s.caps)}>{label}</label>
      <div className={cx(s.box, height === 54 && s.h54, height === 56 && s.h56, error && s.error, locked && s.locked)}>
        {icon && <span className={s.icon} aria-hidden>{icon}</span>}
        {phone && (
          <>
            <span className={s.prefix}>+241</span>
            <span className={s.sep} aria-hidden />
          </>
        )}
        <input
          id={inputId}
          className={cx(s.input, phone && s.tabular)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errId, hintId].filter(Boolean).join(' ') || undefined}
          readOnly={locked || input.readOnly}
          {...(phone ? { inputMode: 'tel' as const, autoComplete: 'tel-national' } : {})}
          {...input}
        />
        {trailing}
      </div>
      {errId && <div id={errId} className={s.errorText}>{error}</div>}
      {hint && <div id={hintId} className={s.hint}>{hint}</div>}
    </div>
  );
}
