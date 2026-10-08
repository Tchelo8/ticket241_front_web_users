import { usePrefs } from '../store/prefs';

/** Logo Ticket241 : version blanche en thème Encre. */
export function Logo({ height = 34, className }: { height?: number; className?: string }) {
  const theme = usePrefs((s) => s.theme);
  const src = theme === 'ink' ? '/images/logoblanc.png' : '/images/logo.png';
  return (
    <img
      src={src}
      alt="Ticket241"
      className={className}
      style={{ height, width: 'auto', filter: theme === 'mono' ? 'var(--img-filter)' : undefined }}
    />
  );
}
