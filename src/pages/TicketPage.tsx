import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useTicket } from '../api/hooks';
import { apiService } from '../api/apiService';
import { TicketPass } from '../components/TicketPass';
import { NotFoundPage } from './NotFoundPage';
import { Loading } from './Loading';
import s from './TicketPage.module.css';

/** Billet d'un compte connecté (le serveur vérifie qu'il lui appartient). */
export function TicketPage() {
  const { ref } = useParams();
  const { data: t, isLoading, isError } = useTicket(ref);

  if (isLoading) return <Loading />;
  if (isError || !t) return <NotFoundPage />;

  return (
    <main className="container container--sm">
      <Link to="/billets" className={`back-link ${s.back}`}><ArrowLeft size={17} />Mes billets</Link>
      <TicketPass ticket={t} download={() => apiService.tickets.downloadPdf(t.ref)} />
    </main>
  );
}
