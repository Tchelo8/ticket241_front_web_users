/** Libellé affiché de la catégorie (« Concert », « Théâtre »…). */
export type Category = string;

/** Catégorie de billet (Standard, VIP…). */
export type TicketType = {
  id: string;
  name: string;
  price: number;
  note: string;
  /** Places restantes dans cette catégorie (inconnu = pas de limite affichée). */
  available?: number;
  /** Nombre maximal de billets par commande. */
  maxPerOrder?: number;
};

export type Event = {
  /** Identifiant utilisé dans les URL (uuid côté API). */
  id: string;
  name: string;
  category: Category;
  venue: string;
  address: string;
  city: string;
  image: string;
  startsAt: string;
  doorsAt: string;
  priceFrom: number;
  seatsLeft: number;
  seatsTotal: number;
  minAge: string;
  organizer: { id: string; name: string };
  description: string;
  /** Vide dans les listes : seul le détail renvoie les catégories de billets. */
  ticketTypes: TicketType[];
  /** Annulation gratuite sous 48 h. */
  refundable: boolean;
  /** La billetterie est ouverte : pilote le bouton « Réserver ». */
  saleOpen: boolean;
  cancelled: boolean;
  /** Mis en avant à l'accueil. */
  featured?: boolean;
  /** Nombre de vues, pour les tendances. */
  views?: number;
};

export type City = { id: string; name: string; region: string };

export type Theme = 'paper' | 'ink' | 'mono';

export type PaymentMethod = 'airtel' | 'moov' | 'card';

export type Ticket = {
  ref: string;
  eventId: string;
  typeName: string;
  quantity: number;
  paid: number;
  method: PaymentMethod;
  usedAt?: string;
};

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export type User = { firstName: string; lastName: string; phone: string; email: string };
