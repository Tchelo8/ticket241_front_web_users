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
  /** Identifiant numérique de l'event-service, attendu par la réservation. */
  numericId: number;
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

/** Statut d'un billet côté ticket-service. */
export type TicketStatus = 'PENDING' | 'RESERVED' | 'PAID' | 'USED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';

/** Un billet = une place (ticket-service crée un billet par place achetée). */
export type Ticket = {
  /** uuid du billet : sert dans les URL. */
  ref: string;
  number: string;
  /** Contenu du QR code scanné à l'entrée (absent dans les listes). */
  qrCode: string;
  orderId: string;
  /** uuid de l'événement (vide dans les listes, qui ne donnent que l'id numérique). */
  eventId: string;
  eventNumericId: number;
  eventName: string;
  startsAt: string;
  venue: string;
  city: string;
  typeName: string;
  color?: string;
  price: number;
  status: TicketStatus;
  usedAt?: string;
  /** Fin de la réservation ou du délai de paiement. */
  expiresAt?: string;
  /** PENDING, PROCESSING, COMPLETED, FAILED… */
  paymentStatus?: string;
};

/** Organisateur de l'annuaire public (structure vérifiée par Ticket241). */
export type Organizer = {
  id: string;
  name: string;
  type: string;
  city: string;
  venue: string;
  description: string;
  logo?: string;
  upcomingCount: number;
};

export type User = { firstName: string; lastName: string; phone: string; email: string };
