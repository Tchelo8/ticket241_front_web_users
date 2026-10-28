import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUUpLeft, Armchair, CalendarBlank, CaretDown, Clock, DoorOpen, Heart, IdentificationBadge,
  MapPin, MapPinArea, ShareNetwork, ShieldCheck, Signpost, UsersThree, type Icon,
} from '@phosphor-icons/react';
import { useEvent, useEvents, useFavorites } from '../api/hooks';
import { QtyStepper } from '../components/QtyStepper';
import { useCart } from '../store/cart';
import {
  fcfa, fcfaShort, formatLongDate, formatLongDateYear, formatShortDate, formatTime, fromPrice, groupNumber, plural,
} from '../lib/format';
import { saleClosedReason, subtotal } from '../lib/events';
import { cx } from '../lib/cx';
import { NotFoundPage } from './NotFoundPage';
import { Loading } from './Loading';
import s from './EventPage.module.css';

const ABOUT_LIMIT = 200;

type InfoRow = { Icon: Icon; label: string; value: string; tag?: { text: string; warn: boolean } };

export const mapsUrl = (q: string) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

export function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: ev, isLoading, isError } = useEvent(id);
  const { data: all = [] } = useEvents();
  const cart = useCart((st) => st.cart);
  const setCart = useCart((st) => st.setCart);
  const { isFav, toggle: toggleFav } = useFavorites();
  const fav = id ? isFav(id) : false;

  const [qty, setQty] = useState<Record<string, number>>({});
  const [aboutOpen, setAboutOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [toast, setToast] = useState('');

  // Reprend le panier en cours s'il concerne cet événement.
  useEffect(() => {
    setQty(cart && cart.eventId === id ? cart.lines : {});
    setAboutOpen(false);
    setInfoOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (isLoading) return <Loading />;
  if (isError || !ev) return <NotFoundPage />;

  // Seules les catégories encore proposées comptent (le panier repris peut être ancien).
  const lines = Object.fromEntries(ev.ticketTypes.map((t) => [t.id, qty[t.id] ?? 0]));
  const count = Object.values(lines).reduce((n, q) => n + q, 0);
  const sub = subtotal(ev, lines);
  const closed = saleClosedReason(ev);
  const longAbout = ev.description.length > ABOUT_LIMIT;
  const about = aboutOpen || !longAbout ? ev.description : ev.description.slice(0, ABOUT_LIMIT).trim() + '…';
  const similar = all.filter((x) => x.id !== ev.id && x.category === ev.category).slice(0, 3);
  // Événements publiés de la même structure (catalogue de l'API)
  const organizerEvents = ev.organizer.id ? all.filter((x) => x.organizer.id === ev.organizer.id).length : 0;
  const lowStock = ev.seatsLeft < 120;

  const info: InfoRow[] = [
    { Icon: CalendarBlank, label: 'Date', value: formatLongDateYear(ev.startsAt) },
    { Icon: Clock, label: 'Heure', value: formatTime(ev.startsAt) },
    { Icon: MapPin, label: 'Lieu', value: `${ev.venue}, ${ev.city}` },
    {
      Icon: Armchair, label: 'Places restantes', value: `${groupNumber(ev.seatsLeft)} sur ${groupNumber(ev.seatsTotal)}`,
      tag: { text: lowStock ? 'Bientôt complet' : 'Disponible', warn: lowStock },
    },
    ...(infoOpen
      ? [
          { Icon: DoorOpen, label: 'Ouverture des portes', value: formatTime(ev.doorsAt) },
          { Icon: Signpost, label: 'Adresse', value: `${ev.address}, ${ev.city}` },
          { Icon: ArrowUUpLeft, label: 'Remboursement', value: ev.refundable ? "Jusqu'à 2 jours avant l'événement" : 'Non remboursable' },
          { Icon: UsersThree, label: 'Âge minimum', value: ev.minAge },
          { Icon: IdentificationBadge, label: 'Organisateur', value: ev.organizer.name },
        ]
      : []),
  ];

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: ev.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast('Lien copié dans le presse-papiers');
      }
    } catch {
      /* partage annulé */
    }
  };

  const reserve = () => {
    if (!count || closed) return;
    setCart({ eventId: ev.id, lines });
    navigate('/paiement');
  };

  return (
    <main>
      <div className={s.hero}>
        <img src={ev.image} alt="" className="evimg" />
        <div className={s.heroShade} />
        <div className={s.backWrap}>
          <button type="button" className={s.back} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/explorer'))}>
            <ArrowLeft size={17} />Retour
          </button>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.main}>
          <div className={s.badges}>
            <span className={cx(s.badge, s.badgeCat)}>{ev.category}</span>
            <span className={cx(s.badge, s.badgeAge)}>{ev.minAge}</span>
          </div>
          <h1 className={s.title}>{ev.name}</h1>
          <div className={s.facts}>
            <span><CalendarBlank size={18} color="var(--acc)" />{formatLongDate(ev.startsAt)} · {formatTime(ev.startsAt)}</span>
            <span><MapPin size={18} color="var(--acc)" />{ev.venue}, {ev.city}</span>
          </div>
          <div className={s.actions}>
            <button type="button" className={cx(s.pillBtn, fav && s.pillOn)} aria-pressed={fav} onClick={() => void toggleFav(ev.id)}>
              <Heart size={18} weight={fav ? 'fill' : 'duotone'} />{fav ? 'Enregistré' : 'Enregistrer'}
            </button>
            <button type="button" className={s.pillBtn} onClick={share}>
              <ShareNetwork size={18} />Partager
            </button>
          </div>

          <div className={s.org}>
            <div className={s.orgAvatar}><IdentificationBadge size={22} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={s.orgName}>{ev.organizer.name}</div>
              <div className={s.orgMeta}>Organisateur{organizerEvents ? ` · ${plural(organizerEvents, 'événement')}` : ''}</div>
            </div>
            {ev.organizer.id && (
              <Link to={`/explorer?organisateur=${encodeURIComponent(ev.organizer.id)}`} className={s.follow}>
                Ses événements
              </Link>
            )}
          </div>

          <h2 className={s.h2}>À propos</h2>
          <p className={s.about}>{about}</p>
          {longAbout && (
            <button type="button" className={cx('link-btn', s.more)} aria-expanded={aboutOpen} onClick={() => setAboutOpen((o) => !o)}>
              {aboutOpen ? 'Voir moins' : 'Lire la suite'}
            </button>
          )}

          <h2 className={s.h2}>Informations générales</h2>
          <div className={s.infoRule} />
          <div className={s.infoGrid} id="infos">
            {info.map(({ Icon: Ico, label, value, tag }) => (
              <div key={label} className={s.infoRow}>
                <Ico size={21} className={s.infoIcon} />
                <div className={s.infoText}>
                  <div className={s.infoLabel}>{label}</div>
                  <div className={s.infoValue}>{value}</div>
                </div>
                {tag && <span className={cx(s.tag, tag.warn ? s.tagWarn : s.tagOk)}>{tag.text}</span>}
              </div>
            ))}
          </div>
          <button
            type="button"
            className={cx('link-btn', s.infoToggle)}
            aria-expanded={infoOpen}
            aria-controls="infos"
            onClick={() => setInfoOpen((o) => !o)}
          >
            {infoOpen ? 'Voir moins' : 'Voir plus'}
            <CaretDown size={14} className={cx(s.caret, infoOpen && s.caretOpen)} />
          </button>

          <h2 className={s.h2}>Le lieu</h2>
          <div className={s.map}>
            <div className={s.mapImg}>
              <img src="/images/map.jpg" alt={`Carte : ${ev.venue}`} className="evimg" />
              <MapPinArea size={40} className={s.mapPin} />
            </div>
            <div className={s.mapFoot}>
              <div>
                <div className={s.venueName}>{ev.venue}</div>
                <div className={s.venueAddr}>{ev.address}, {ev.city}</div>
              </div>
              <a
                className={cx('btn btn--outline', s.route)}
                href={mapsUrl(`${ev.venue}, ${ev.address}, ${ev.city}, Gabon`)}
                target="_blank"
                rel="noreferrer"
              >
                Itinéraire
              </a>
            </div>
          </div>
        </div>

        <aside className={cx(s.box, 'sticky-aside')} aria-label="Billets">
          <div className="overline">Billets</div>
          <div className={s.boxFrom}>{fromPrice(ev.priceFrom)}</div>
          <div className={s.types}>
            {ev.ticketTypes.map((t) => {
              const max = Math.min(t.maxPerOrder ?? 10, t.available ?? Infinity);
              return (
                <div key={t.id} className={cx(s.type, lines[t.id] > 0 && s.typeOn)}>
                  <div className={s.typeText}>
                    <div className={s.typeName}>{t.name}</div>
                    <div className={s.typePrice}>{fcfa(t.price)}</div>
                    <div className={s.typeNote}>{t.available === 0 ? 'Épuisé' : t.note}</div>
                  </div>
                  {!closed && max > 0 && (
                    <QtyStepper label={t.name} value={lines[t.id]} max={max} onChange={(v) => setQty((q) => ({ ...q, [t.id]: v }))} />
                  )}
                </div>
              );
            })}
          </div>
          <div className={s.sub}>
            <span className={s.subLabel}>Sous-total</span>
            <span className={s.subValue} aria-live="polite">{fcfa(sub)}</span>
          </div>
          <button
            type="button"
            className={cx('btn btn--primary btn--block', s.buy)}
            aria-disabled={!count || !!closed || undefined}
            onClick={reserve}
          >
            {closed ?? (count ? `Réserver · ${plural(count, 'billet')}` : 'Choisir un billet')}
          </button>
          {ev.refundable && (
            <div className={s.note}>
              <ShieldCheck size={19} />
              Annulation gratuite jusqu'à 48 h avant l'événement. Remboursement intégral.
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className={s.similar} aria-labelledby="h-similar">
          <h2 className="section-title" id="h-similar" style={{ marginBottom: 16 }}>Dans la même veine</h2>
          <div className={s.similarGrid}>
            {similar.map((x) => (
              <div key={x.id} className={s.simCard}>
                <img src={x.image} alt="" className="evimg" />
                <div style={{ minWidth: 0 }}>
                  <div className={s.simDate}>{formatShortDate(x.startsAt)}</div>
                  <div className={s.simName}><Link to={`/evenements/${x.id}`}>{x.name}</Link></div>
                  <div className={s.simPrice}>{fcfaShort(x.priceFrom)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {toast && <div className={s.toast} role="status">{toast}</div>}
    </main>
  );
}
