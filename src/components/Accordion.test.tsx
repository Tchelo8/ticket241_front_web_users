import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionItem } from './Accordion';

function Faq({ initial = null }: { initial?: string | null }) {
  const [open, setOpen] = useState<string | null>(initial);
  return (
    <Accordion openId={open} onChange={setOpen}>
      <AccordionItem id="a" tag="Billets" question="Où trouver mes billets ?">Dans Mes billets.</AccordionItem>
      <AccordionItem id="b" tag="Paiement" question="Quels moyens de paiement ?">Airtel Money et Moov Money.</AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('ouvre une question et lie la réponse au bouton', async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const q = screen.getByRole('button', { name: /Où trouver mes billets/ });
    expect(q).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();

    await user.click(q);
    expect(q).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: /Où trouver mes billets/ });
    expect(region).toHaveTextContent('Dans Mes billets.');
    expect(q).toHaveAttribute('aria-controls', region.id);
  });

  it('ne garde qu’une question ouverte à la fois et se referme', async () => {
    const user = userEvent.setup();
    render(<Faq initial="a" />);
    const a = screen.getByRole('button', { name: /Où trouver/ });
    const b = screen.getByRole('button', { name: /Quels moyens/ });
    expect(a).toHaveAttribute('aria-expanded', 'true');

    await user.click(b);
    expect(a).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('region')).toHaveLength(1);

    await user.click(b);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
