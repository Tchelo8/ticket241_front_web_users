import s from './CornerMarks.module.css';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

/** Équerres de presse d'un cadre (14px, filets 1,5px, à 10px des angles). */
export function CornerMarks({ corners = ['tl', 'tr', 'bl', 'br'] }: { corners?: Corner[] }) {
  return (
    <>
      {corners.map((c) => (
        <span key={c} className={`${s.mark} ${s[c]}`} aria-hidden />
      ))}
    </>
  );
}
