import type { Category, City, Event, TicketType } from '../types';

/** Pass Carré VIP = Standard × 2,4 arrondi au demi-millier. */
export const vipPrice = (std: number) => Math.round((std * 2.4) / 500) * 500;

const types = (price: number): TicketType[] => [
  { id: 'std', name: 'Billet Standard', price, note: 'Accès général · 1 personne' },
  { id: 'vip', name: 'Pass Carré VIP', price: vipPrice(price), note: 'Placement assis + boisson' },
];

type Raw = Omit<Event, 'ticketTypes' | 'refundable'>;

const RAW: Raw[] = [
  {
    id: 'jazz', name: 'Nuit du Jazz de Libreville', category: 'Concert', venue: 'Institut Français',
    address: 'Boulevard du Bord de Mer', city: 'Libreville', image: '/images/jazz.png',
    startsAt: '2026-09-12T20:30:00+01:00', doorsAt: '2026-09-12T19:45:00+01:00', priceFrom: 15000,
    seatsLeft: 186, seatsTotal: 450, minAge: 'Tout public',
    organizer: { id: 'ifg', name: 'Institut Français du Gabon' },
    description: "Trois formations, une seule nuit. Le trio de Serge Ondo ouvre à 20h30, suivi du quintet cubain Habana Sur, puis d'un bœuf libre jusqu'à deux heures du matin. Bar et grillades sur la terrasse, entrée par le boulevard du Bord de Mer.",
  },
  {
    id: 'sibang', name: 'Sibang Trail 12 K', category: 'Sport', venue: 'Arboretum de Sibang',
    address: 'Route de Nzeng-Ayong', city: 'Libreville', image: '/images/sibang.jpg',
    startsAt: '2026-09-06T06:30:00+01:00', doorsAt: '2026-09-06T05:45:00+01:00', priceFrom: 5000,
    seatsLeft: 312, seatsTotal: 600, minAge: '16 ans',
    organizer: { id: 'trail', name: 'Gabon Trail Collectif' },
    description: "Douze kilomètres de piste forestière au cœur de l'arboretum, avec deux ravitaillements et un chronométrage à puce. Départ groupé à 6h30, avant la chaleur.",
  },
  {
    id: 'ogooue', name: 'Ogooué Fest — Port-Gentil', category: 'Festival', venue: 'Baie des Tortues',
    address: 'Front de mer', city: 'Port-Gentil', image: '/images/oiseau.jpg',
    startsAt: '2026-09-20T17:00:00+01:00', doorsAt: '2026-09-20T16:00:00+01:00', priceFrom: 20000,
    seatsLeft: 1480, seatsTotal: 2500, minAge: 'Tout public',
    organizer: { id: 'ogooue', name: 'Ogooué Culture' },
    description: "Deux scènes face à l'océan, dix-huit artistes de la sous-région, un village d'artisans et une programmation jeunesse l'après-midi.",
  },
  {
    id: 'pantheres', name: 'Panthères vs Étalons', category: 'Sport', venue: "Stade d'Angondjé",
    address: 'Angondjé', city: 'Libreville', image: '/images/enb.jpg',
    startsAt: '2026-09-28T16:00:00+01:00', doorsAt: '2026-09-28T14:30:00+01:00', priceFrom: 10000,
    seatsLeft: 94, seatsTotal: 8500, minAge: 'Tout public',
    organizer: { id: 'fegafoot', name: 'Fédération Gabonaise de Football' },
    description: "Éliminatoires, troisième journée. Tribunes latérales et virages, ouverture des portes une heure trente avant le coup d'envoi.",
  },
  {
    id: 'nuitblanche', name: 'Nuit Blanche de Franceville', category: 'Concert', venue: 'Place de la Rénovation',
    address: 'Haut-Ogooué', city: 'Franceville', image: '/images/party.png',
    startsAt: '2026-10-04T21:00:00+01:00', doorsAt: '2026-10-04T20:00:00+01:00', priceFrom: 8000,
    seatsLeft: 640, seatsTotal: 1200, minAge: '18 ans',
    organizer: { id: 'franceville', name: 'Mairie de Franceville' },
    description: "La place devient piste de danse jusqu'au lever du jour : afrobeat, rumba et une scène ouverte aux DJ du Haut-Ogooué.",
  },
  {
    id: 'createurs', name: 'Marché des Créateurs', category: 'Exposition', venue: 'Jardin Botanique',
    address: 'Quartier Louis', city: 'Libreville', image: '/images/ticketHome.png',
    startsAt: '2026-08-30T10:00:00+01:00', doorsAt: '2026-08-30T09:30:00+01:00', priceFrom: 2000,
    seatsLeft: 74, seatsTotal: 300, minAge: 'Tout public',
    organizer: { id: 'makaya', name: 'Collectif Makaya' },
    description: 'Quarante créateurs gabonais — textile, bijou, céramique, édition — sur une journée, avec ateliers pour les enfants.',
  },
  {
    id: 'diaspora', name: 'Afrobeat Night · Diaspora Live', category: 'Concert', venue: 'Complexe Bord de Mer',
    address: 'Bord de Mer', city: 'Libreville', image: '/images/party.png',
    startsAt: '2026-10-18T22:00:00+01:00', doorsAt: '2026-10-18T21:00:00+01:00', priceFrom: 12000,
    seatsLeft: 410, seatsTotal: 1500, minAge: '18 ans',
    organizer: { id: 'diaspora', name: 'Diaspora Sounds' },
    description: "Quatre DJ et deux invités surprise pour une nuit afrobeat sur le bord de mer, jusqu'au petit matin.",
  },
  {
    id: 'basket', name: 'Finale Coupe du Gabon · Basket', category: 'Sport', venue: 'Gymnase de Nzeng-Ayong',
    address: 'Nzeng-Ayong', city: 'Libreville', image: '/images/enb.jpg',
    startsAt: '2026-10-11T18:00:00+01:00', doorsAt: '2026-10-11T17:00:00+01:00', priceFrom: 6000,
    seatsLeft: 220, seatsTotal: 2200, minAge: 'Tout public',
    organizer: { id: 'fegaba', name: 'Fédération Gabonaise de Basket' },
    description: 'La finale nationale, précédée du match des espoirs à 16 h.',
  },
  {
    id: 'gospel', name: 'Grand Gospel de la Cathédrale', category: 'Concert', venue: 'Cathédrale Sainte-Marie',
    address: 'Quartier Louis', city: 'Libreville', image: '/images/oiseau.jpg',
    startsAt: '2026-10-25T19:00:00+01:00', doorsAt: '2026-10-25T18:15:00+01:00', priceFrom: 4000,
    seatsLeft: 520, seatsTotal: 900, minAge: 'Tout public',
    organizer: { id: 'sainte', name: 'Chorale Sainte-Marie' },
    description: 'Six chorales de Libreville réunies pour un concert de deux heures, au bénéfice des œuvres paroissiales.',
  },
];

export const EVENTS: Event[] = RAW.map((e) => ({
  ...e,
  ticketTypes: types(e.priceFrom),
  // Règle du prototype : les billets à partir de 5 000 FCFA sont remboursables sous 48 h.
  refundable: e.priceFrom >= 5000,
}));

export const CITIES: City[] = [
  { name: 'Libreville', region: 'Estuaire', count: 24 },
  { name: 'Port-Gentil', region: 'Ogooué-Maritime', count: 11 },
  { name: 'Franceville', region: 'Haut-Ogooué', count: 7 },
  { name: 'Oyem', region: 'Woleu-Ntem', count: 4 },
  { name: 'Lambaréné', region: 'Moyen-Ogooué', count: 3 },
  { name: 'Moanda', region: 'Haut-Ogooué', count: 2 },
  { name: 'Tchibanga', region: 'Nyanga', count: 2 },
];

export const CATEGORIES: ('Tous' | Category)[] = ['Tous', 'Concert', 'Sport', 'Festival', 'Théâtre', 'Exposition'];

/** Mise en avant de l'accueil (identique au prototype). */
export const HOME_LAYOUT = {
  featured: 'jazz',
  side: ['ogooue', 'pantheres'],
  trending: [
    { id: 'ogooue', trend: '+186 %' },
    { id: 'jazz', trend: '+124 %' },
    { id: 'diaspora', trend: '+97 %' },
    { id: 'pantheres', trend: '+61 %' },
  ],
  thisWeek: ['sibang', 'ogooue', 'nuitblanche', 'basket'],
};
