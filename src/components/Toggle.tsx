import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import s from './Toggle.module.css';

/** Piste seule (décorative, à placer dans un contrôle). */
export function ToggleTrack({ on }: { on: boolean }) {
  return (
    <span className={cx(s.track, on && s.on)} aria-hidden>
      <span className={s.knob} />
    </span>
  );
}

/** Interrupteur 46×26px avec son libellé, rôle switch. */
export function Toggle({
  on, onChange, children, className,
}: { on: boolean; onChange: (v: boolean) => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={cx(s.row, className)} onClick={() => onChange(!on)}>
      {children}
      <ToggleTrack on={on} />
    </button>
  );
}
