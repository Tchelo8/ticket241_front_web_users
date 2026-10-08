import { CircleHalf, Moon, Sun } from '@phosphor-icons/react';
import { usePrefs } from '../store/prefs';
import type { Theme } from '../types';
import { cx } from '../lib/cx';
import s from './ThemeSwitch.module.css';

const THEMES: { id: Theme; label: string; Icon: typeof Sun }[] = [
  { id: 'paper', label: 'Papier', Icon: Sun },
  { id: 'ink', label: 'Encre', Icon: Moon },
  { id: 'mono', label: 'Noir & blanc', Icon: CircleHalf },
];

export function ThemeSwitch() {
  const theme = usePrefs((st) => st.theme);
  const setTheme = usePrefs((st) => st.setTheme);
  return (
    <div className={s.root} role="radiogroup" aria-label="Thème">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          aria-label={label}
          title={label}
          className={cx(s.btn, theme === id && s.active)}
          onClick={() => setTheme(id)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
