import { createContext, useContext, useId, type ReactNode } from 'react';
import { Plus } from '@phosphor-icons/react';
import { cx } from '../lib/cx';
import s from './Accordion.module.css';

type Ctx = { openId: string | null; toggle: (id: string) => void };
const AccordionContext = createContext<Ctx>({ openId: null, toggle: () => {} });

/** Liste de questions dépliables ; une seule ouverte à la fois (état contrôlé). */
export function Accordion({ openId, onChange, children }: { openId: string | null; onChange: (id: string | null) => void; children: ReactNode }) {
  return (
    <AccordionContext.Provider value={{ openId, toggle: (id) => onChange(openId === id ? null : id) }}>
      <div className={s.list}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ id, tag, question, children }: { id: string; tag?: string; question: string; children: ReactNode }) {
  const { openId, toggle } = useContext(AccordionContext);
  const uid = useId();
  const open = openId === id;
  const btnId = `${uid}-q`;
  const panelId = `${uid}-a`;
  return (
    <div className={cx(s.item, open && s.open)}>
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          id={btnId}
          className={s.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => toggle(id)}
        >
          {tag && <span className={s.tag}>{tag}</span>}
          <span className={s.q}>{question}</span>
          <Plus size={18} className={s.plus} aria-hidden />
        </button>
      </h3>
      {open && (
        <div id={panelId} role="region" aria-labelledby={btnId} className={s.panel}>
          {children}
        </div>
      )}
    </div>
  );
}
