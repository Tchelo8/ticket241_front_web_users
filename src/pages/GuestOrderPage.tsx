import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DownloadSimple, LinkSimple, WarningCircle } from '@phosphor-icons/react';
import { useOrder } from '../api/hooks';
import { ApiError, apiService, saveFile } from '../api/apiService';
import { TicketPass, isValidTicket } from '../components/TicketPass';
import { useAuth } from '../store/auth';
import { METHODS, useCheckout } from '../store/checkout';
import { useGuestOrders } from '../store/guestOrders';
import { orderOutcome } from './WaitingPage';
import { Loading } from './Loading';
import type { PaymentMethod } from '../types';
import s from './TicketPage.module.css';

/**
 * Commande passée sans compte. Le jeton d'accès est dans le lien, après « # » (jamais envoyé
 * aux serveurs web), ou retrouvé dans les commandes gardées sur cet appareil.
 */
export function GuestOrderPage() {
  const { orderId = '' } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuth((st) => st.user);
  const { orders, add } = useGuestOrders();
  const { setPayment, setMethod } = useCheckout();
  const token = hash.replace(/^#/, '') || orders.find((o) => o.orderId === orderId)?.token || '';
  const order = token ? { orderId, guestToken: token } : undefined;
  const { data: tickets, isLoading, isError, error } = useOrder(order, true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  // Lien ouvert sur un autre appareil : on garde la commande pour la retrouver dans « Mes billets »
  useEffect(() => {
    if (tickets?.length && token && !orders.some((o) => o.orderId === orderId)) {
      add({ orderId, token, eventName: tickets[0].eventName, createdAt: new Date().toISOString() });
    }
  }, [tickets, token, orderId, orders, add]);

  if (!order) {
    return (
      <main className="container container--sm">
        <h1 className="screen-title">Lien incomplet</h1>
        <p>Ce lien de commande ne contient pas sa clé d'accès. Utilisez le lien complet reçu à l'achat, ou retrouvez vos billets avec votre numéro.</p>
        <Link to="/retrouver-mes-billets" className="btn btn--primary">Retrouver mes billets</Link>
      </main>
    );
  }
  if (isLoading) return <Loading />;
  if (isError || !tickets) {
    const denied = error instanceof ApiError && error.status === 403;
    return (
      <main className="container container--sm">
        <h1 className="screen-title">{denied ? 'Lien invalide' : 'Commande indisponible'}</h1>
        <p>{denied ? "Ce lien de commande n'est plus valable (commande rattachée à un compte, ou lien erroné)." : 'Réessayez dans quelques instants.'}</p>
        <Link to="/retrouver-mes-billets" className="btn btn--primary">Retrouver mes billets</Link>
      </main>
    );
  }

  const outcome = orderOutcome(tickets);
  const awaitingPayment = tickets.some((t) => t.status === 'RESERVED' && t.paymentStatus !== 'PROCESSING');
  const paying = tickets.some((t) => t.status === 'RESERVED' && t.paymentStatus === 'PROCESSING');
  const total = tickets.reduce((n, t) => n + t.price, 0);

  const pay = async (method: PaymentMethod) => {
    setBusy('pay');
    setMessage('');
    try {
      // Sans compte, le serveur envoie la demande au numéro de la commande
      await apiService.orders.pay(order, method, '');
      setMethod(method);
      setPayment({ stage: 'waiting', orderId, guestToken: token, amount: total, phone: '', eventId: tickets[0].eventId, count: tickets.length });
      navigate('/paiement/attente');
    } catch (err) {
      setMessage(err instanceof ApiError && err.serverMessage ? err.serverMessage : 'La demande de paiement a échoué, réessayez.');
    } finally {
      setBusy('');
    }
  };

  const downloadAll = async () => {
    setBusy('pdf');
    try {
      saveFile(await apiService.orders.downloadPdf(order), `billets-ticket241-${orderId.slice(0, 8)}.pdf`);
    } catch {
      setMessage('Le téléchargement a échoué, réessayez.');
    } finally {
      setBusy('');
    }
  };

  const claim = async () => {
    setBusy('claim');
    setMessage('');
    try {
      await apiService.orders.claim({ orderId, guestToken: token });
      useGuestOrders.getState().remove(orderId);
      qc.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/billets', { replace: true });
    } catch (err) {
      setMessage(err instanceof ApiError && err.serverMessage ? err.serverMessage : 'Le rattachement a échoué, réessayez.');
    } finally {
      setBusy('');
    }
  };

  return (
    <main className="container container--sm">
      <Link to="/billets" className={`back-link ${s.back}`}><ArrowLeft size={17} />Mes billets</Link>
      <h1 className="screen-title">Votre commande</h1>
      <p style={{ color: 'var(--ink2)' }}>
        Gardez ce lien : il donne accès à vos billets sans compte. <LinkSimple size={15} aria-hidden />
      </p>

      {message && (
        <div role="alert" style={{ display: 'flex', gap: 8, color: 'var(--acc2)', marginTop: 12 }}>
          <WarningCircle size={20} />{message}
        </div>
      )}

      {awaitingPayment && outcome === 'pending' && (
        <section style={{ marginTop: 16 }}>
          <p>Cette commande attend son paiement. La demande partira sur le numéro de la commande.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['airtel', 'moov'] as PaymentMethod[]).map((m) => (
              <button key={m} type="button" className="btn btn--primary" disabled={!!busy} onClick={() => pay(m)}>
                Payer avec {METHODS[m].name}
              </button>
            ))}
          </div>
        </section>
      )}
      {paying && <p style={{ marginTop: 16 }}>Paiement en cours de confirmation : validez la demande sur votre téléphone.</p>}
      {outcome === 'expired' && <p style={{ marginTop: 16 }}>Cette commande a expiré sans paiement : les places ont été libérées.</p>}

      {tickets.some(isValidTicket) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" className="btn btn--primary" onClick={downloadAll} disabled={!!busy}>
            <DownloadSimple size={18} />{busy === 'pdf' ? 'Téléchargement…' : 'Télécharger tous les billets (PDF)'}
          </button>
          {user && (
            <button type="button" className="btn btn--outline" onClick={claim} disabled={!!busy}>
              Ajouter à mon compte
            </button>
          )}
        </div>
      )}

      {tickets.map((t) => (
        <TicketPass key={t.ref} ticket={t} download={() => apiService.orders.downloadPdf(order)} />
      ))}
    </main>
  );
}
