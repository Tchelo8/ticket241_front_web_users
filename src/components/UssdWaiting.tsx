import type { CSSProperties } from 'react';
import s from './UssdWaiting.module.css';

/** Composition d'anneaux animés autour du logo du fournisseur. */
export function UssdWaiting({ tint, logo }: { tint: string; logo?: string }) {
  return (
    <div className={s.root} style={{ '--tint': tint } as CSSProperties} aria-hidden>
      <div className={s.pulse} />
      <div className={`${s.pulse} ${s.d1}`} />
      <div className={`${s.pulse} ${s.d2}`} />
      <div className={s.dashed} />
      <div className={s.progress} />
      <div className={s.disc}>{logo && <img src={logo} alt="" className="evimg" />}</div>
    </div>
  );
}
