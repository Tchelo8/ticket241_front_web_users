import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import {
  Anchor, Buildings, CaretDown, CheckCircle, MapPin, Mountains, Shovel, SunHorizon, Tree, Waves, type Icon,
} from '@phosphor-icons/react';
import { CITIES } from '../mocks/events';
import { usePrefs } from '../store/prefs';
import { cx } from '../lib/cx';
import { plural } from '../lib/format';
import s from './CityMenu.module.css';

const CITY_ICONS: Record<string, Icon> = {
  Libreville: Buildings, 'Port-Gentil': Anchor, Franceville: Mountains, Oyem: Tree,
  'Lambaréné': Waves, Moanda: Shovel, Tchibanga: SunHorizon,
};

/** Pastille ville + menu déroulant (listbox, flèches, Échap, clic extérieur). */
export function CityMenu() {
  const city = usePrefs((st) => st.city);
  const setCity = usePrefs((st) => st.setCity);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setFocus(Math.max(0, CITIES.findIndex((c) => c.name === city)));
    listRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, city]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const pick = (name: string) => {
    setCity(name);
    close();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => (f + 1) % CITIES.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => (f - 1 + CITIES.length) % CITIES.length); }
    else if (e.key === 'Home') { e.preventDefault(); setFocus(0); }
    else if (e.key === 'End') { e.preventDefault(); setFocus(CITIES.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(CITIES[focus].name); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={rootRef} className={cx(s.root, open && s.open)}>
      <button
        ref={buttonRef}
        type="button"
        className={s.pill}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Ville : ${city}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); }
        }}
      >
        <MapPin size={17} className={s.pin} />
        <span>{city}</span>
        <CaretDown size={12} className={s.caret} />
      </button>
      {open && (
        <div className={s.panel}>
          <div className={s.label} id={listId + '-label'}>Votre ville</div>
          <ul
            ref={listRef}
            id={listId}
            className={s.list}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={listId + '-label'}
            aria-activedescendant={`${listId}-${focus}`}
            onKeyDown={onKey}
          >
            {CITIES.map((c, i) => {
              const Ico = CITY_ICONS[c.name] ?? MapPin;
              const selected = c.name === city;
              return (
                <li
                  key={c.name}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  className={cx(s.option, selected && s.selected, i === focus && s.focused)}
                  onClick={() => pick(c.name)}
                  onMouseEnter={() => setFocus(i)}
                >
                  <Ico size={19} />
                  <span className={s.text}>
                    <span className={s.name}>{c.name}</span>
                    <span className={s.meta}>{c.region} · {plural(c.count, 'événement')}</span>
                  </span>
                  {selected && <CheckCircle size={19} weight="fill" className={s.check} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
