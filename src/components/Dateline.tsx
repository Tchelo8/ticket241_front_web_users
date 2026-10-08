import s from './Dateline.module.css';

/** Filet 3px, ligne capitales (date · région), filet 1px. */
export function Dateline({ left, right }: { left: string; right: string }) {
  return (
    <div>
      <div className="rule-thick" />
      <div className={s.row}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className={s.thin} />
    </div>
  );
}
