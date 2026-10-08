import type { ReactNode } from 'react';
import { CornerMarks } from './CornerMarks';
import { LottiePlayer } from './LottiePlayer';
import s from './EmptyState.module.css';

type Props = {
  /** Icône Phosphor de repli (animée en `bob`) si aucun Lottie n'est fourni. */
  icon?: ReactNode;
  lottie?: unknown;
  caption?: string;
  title: string;
  titleItalic?: string;
  body: string;
  cta?: ReactNode;
  secondary?: ReactNode;
  headingLevel?: 'h1' | 'h2';
};

/** Gabarit d'état vide : cadre à équerres + animation, puis titre en deux temps, phrase et actions. */
export function EmptyState({ icon, lottie, caption, title, titleItalic, body, cta, secondary, headingLevel = 'h2' }: Props) {
  const H = headingLevel;
  return (
    <div className={s.root}>
      <div className={s.frame}>
        <CornerMarks />
        {lottie ? <LottiePlayer data={lottie} size={150} /> : <span className={s.icon}>{icon}</span>}
        {caption && <div className={s.caption}>{caption}</div>}
      </div>
      <div className={s.text}>
        <H className={s.title}>
          {title}
          {titleItalic && <span className={s.italic}>{titleItalic}</span>}
        </H>
        <p className={s.body}>{body}</p>
        {(cta || secondary) && (
          <div className={s.actions}>
            {cta}
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}
