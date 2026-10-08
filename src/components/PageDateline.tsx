import { Dateline } from './Dateline';

/** En-tête des pages éditoriales : filet 3px, ligne en capitales, filet 1px. */
export function PageDateline({ left, right }: { left: string; right: string }) {
  return <Dateline left={left} right={right} />;
}
