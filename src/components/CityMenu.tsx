import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CaretDown, CheckCircle, MapPin } from '@phosphor-icons/react';
import { useCities, useEvents } from '../api/hooks';
import { usePrefs } from '../store/prefs';
import { cx } from '../lib/cx';
import { plural } from '../lib/format';
import { isPast } from '../lib/events';
import s from './CityMenu.module.css';

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
  const { data: cities = [] } = useCities();
  const { data: events = [] } = useEvents();
  // Événements à venir par ville (l'eventCount de l'API compte aussi les brouillons).
  const countIn = (name: string) => events.filter((e) => e.city === name && !isPast(e) && !e.cancelled).length;

  useEffect(() => {
    if (!open) return;
    setFocus(Math.max(0, cities.findIndex((c) => c.name === city)));
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
    else if (!cities.length) return;
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => (f + 1) % cities.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => (f - 1 + cities.length) % cities.length); }
    else if (e.key === 'Home') { e.preventDefault(); setFocus(0); }
    else if (e.key === 'End') { e.preventDefault(); setFocus(cities.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cities[focus]) pick(cities[focus].name); }
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
            {cities.map((c, i) => {
              const selected = c.name === city;
              return (
                <li
                  key={c.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  className={cx(s.option, selected && s.selected, i === focus && s.focused)}
                  onClick={() => pick(c.name)}
                  onMouseEnter={() => setFocus(i)}
                >
                  <span className={s.text}>
                    <span className={s.name}>{c.name}</span>
                    <span className={s.meta}>{c.region ? c.region + ' · ' : ''}{plural(countIn(c.name), 'événement')}</span>
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
