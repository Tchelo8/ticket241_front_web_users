export type Category = 'Concert' | 'Sport' | 'Festival' | 'Théâtre' | 'Exposition';

export type TicketType = { id: 'std' | 'vip'; name: string; price: number; note: string };

export type Event = {
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
  ticketTypes: TicketType[];
  /** Annulation gratuite sous 48 h. */
  refundable: boolean;
};

export type City = { name: string; region: string; count: number };

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
