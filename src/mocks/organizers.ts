/**
 * Annuaire des organisateurs (données de démonstration).
 *
 * IMPORTANT : pour les structures réelles (Entre Nous Bar, Le Code Bar, Le Palenqué,
 * LINAF…), les quartiers, chiffres, dates et descriptions sont FICTIFS. Ne pas mettre
 * en production sans les vraies informations et l'accord des structures pour l'usage
 * de leur nom et de leur logo.
 */
export const ORGANIZER_TYPES = ['Bars & clubs', 'Sport', 'Culture & institutions', 'Festivals & collectifs'] as const;
export type OrganizerType = (typeof ORGANIZER_TYPES)[number];

export type Organizer = {
  id: string;
  name: string;
  type: OrganizerType;
  /** « Bar · Lounge », « Ligue de football »… */
  kind: string;
  city: string;
  area: string;
  since?: string;
  verified: boolean;
  logo?: string;
  cover: string;
  description: string;
  upcomingCount: number;
  followers: number;
  nextEvent?: { id?: string; label: string };
};

export const ORGANIZERS: Organizer[] = [
  { id: 'entrenous', name: 'Entre Nous Bar', type: 'Bars & clubs', kind: 'Bar · Lounge', city: 'Libreville', area: 'Quartier Louis', since: '2015', verified: true, cover: '/images/party.png', upcomingCount: 6, followers: 4820, description: 'Bar-lounge emblématique de Libreville : concerts acoustiques en semaine, DJ sets le week-end.', nextEvent: { label: 'Soirée Rumba Live · ven. 10 oct.' } },
  { id: 'codebar', name: 'Le Code Bar', type: 'Bars & clubs', kind: 'Bar · Club', city: 'Libreville', area: 'Centre-ville', since: '2018', verified: true, cover: '/images/party.png', upcomingCount: 4, followers: 3150, description: "Cocktails et sélections afro house, amapiano et coupé-décalé jusqu'à l'aube.", nextEvent: { label: 'Afro House Session · sam. 11 oct.' } },
  { id: 'palenque', name: 'Le Palenqué', type: 'Bars & clubs', kind: 'Bar latino · Salsa', city: 'Libreville', area: 'Bord de mer', since: '2012', verified: true, cover: '/images/jazz.png', upcomingCount: 5, followers: 2740, description: "La maison de la salsa à Libreville : cours d'initiation à 20 h, piste ouverte ensuite.", nextEvent: { label: 'Nuit Salsa & Bachata · jeu. 9 oct.' } },
  { id: 'linaf', name: 'LINAF', type: 'Sport', kind: 'Ligue de football', city: 'Libreville', area: 'National', verified: true, cover: '/images/enb.jpg', upcomingCount: 12, followers: 18300, description: 'Championnat national : calendrier, billetterie des journées et des matchs au sommet.', nextEvent: { label: 'Journée 4 du championnat · dim. 12 oct.' } },
  { id: 'fegaba', name: 'Fédération Gabonaise de Basket', type: 'Sport', kind: 'Fédération', city: 'Libreville', area: 'Nzeng-Ayong', verified: true, cover: '/images/enb.jpg', upcomingCount: 3, followers: 5210, description: 'Coupe du Gabon, championnat et matchs des sélections nationales.', nextEvent: { id: 'basket', label: 'Finale Coupe du Gabon · sam. 11 oct.' } },
  { id: 'trail', name: 'Gabon Trail Collectif', type: 'Sport', kind: 'Course · Nature', city: 'Libreville', area: 'Sibang', since: '2019', verified: false, cover: '/images/sibang.jpg', upcomingCount: 2, followers: 1460, description: 'Courses nature et sorties encadrées dans les forêts autour de Libreville.', nextEvent: { id: 'sibang', label: 'Sibang Trail 12 K · sam. 6 sept.' } },
  { id: 'ifg', name: 'Institut Français du Gabon', type: 'Culture & institutions', kind: 'Centre culturel', city: 'Libreville', area: 'Bord de mer', verified: true, cover: '/images/jazz.png', upcomingCount: 9, followers: 9640, description: "Concerts, cinéma, théâtre et expositions toute l'année, dans la grande salle et sur la terrasse.", nextEvent: { id: 'jazz', label: 'Nuit du Jazz de Libreville · ven. 12 sept.' } },
  { id: 'franceville', name: 'Mairie de Franceville', type: 'Culture & institutions', kind: 'Collectivité', city: 'Franceville', area: 'Haut-Ogooué', verified: true, cover: '/images/party.png', upcomingCount: 2, followers: 2380, description: 'Les grands rendez-vous gratuits et payants de la ville, de la Nuit Blanche aux fêtes de quartier.', nextEvent: { id: 'nuitblanche', label: 'Nuit Blanche · sam. 4 oct.' } },
  { id: 'sainte', name: 'Chorale Sainte-Marie', type: 'Culture & institutions', kind: 'Chorale', city: 'Libreville', area: 'Quartier Louis', since: '1998', verified: false, cover: '/images/oiseau.jpg', upcomingCount: 1, followers: 870, description: 'Concerts de gospel et de musique sacrée, au profit des œuvres de la paroisse.', nextEvent: { id: 'gospel', label: 'Grand Gospel · sam. 25 oct.' } },
  { id: 'ogooue', name: 'Ogooué Culture', type: 'Festivals & collectifs', kind: 'Festival', city: 'Port-Gentil', area: 'Ogooué-Maritime', since: '2016', verified: true, cover: '/images/oiseau.jpg', upcomingCount: 1, followers: 6720, description: "Organisateur de l'Ogooué Fest : deux scènes face à l'océan et un village d'artisans.", nextEvent: { id: 'ogooue', label: 'Ogooué Fest · sam. 20 sept.' } },
  { id: 'diaspora', name: 'Diaspora Sounds', type: 'Festivals & collectifs', kind: 'Collectif · DJ', city: 'Libreville', area: 'Bord de mer', since: '2020', verified: false, cover: '/images/party.png', upcomingCount: 3, followers: 4090, description: 'Collectif de DJ gabonais de la diaspora, nuits afrobeat et invités surprise.', nextEvent: { id: 'diaspora', label: 'Afrobeat Night · sam. 18 oct.' } },
  { id: 'makaya', name: 'Collectif Makaya', type: 'Festivals & collectifs', kind: 'Créateurs', city: 'Libreville', area: 'Jardin Botanique', since: '2017', verified: false, cover: '/images/ticketHome.png', upcomingCount: 1, followers: 1930, description: 'Quarante créateurs gabonais réunis plusieurs fois par an : textile, bijou, céramique, édition.', nextEvent: { id: 'createurs', label: 'Marché des Créateurs · sam. 30 août' } },
];

/** Organisateurs suivis au départ (démonstration). */
export const SEED_FOLLOWED = ['ifg', 'palenque'];

/** Monogramme : deux lettres, utilisé quand l'organisateur n'a pas de logo. */
export const MONOGRAMS: Record<string, string> = {
  entrenous: 'EN', codebar: 'CB', palenque: 'PQ', linaf: 'LF', fegaba: 'FB', trail: 'GT',
  ifg: 'IF', franceville: 'MF', sainte: 'SM', ogooue: 'OC', diaspora: 'DS', makaya: 'MK',
};
