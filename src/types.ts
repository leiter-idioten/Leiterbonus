export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  birthDate: string; // YYYY-MM-DD
  createdAt: string;
  /** Demo-Veranstalter aus den Beispieldaten (kein echter Login) */
  isDemoHost?: boolean;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
}

export interface Party {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  emoji: string;
  start: string; // ISO
  end: string; // ISO
  city: string;
  address: string;
  lat: number;
  lng: number;
  /** true = auf der Karte nur ungefähre Lage, Adresse erst nach Zusage */
  hideAddress: boolean;
  music: string[];
  drinks: Drink[];
  entryPrice: number;
  maxGuests: number;
  minAge: number;
  /** true = Veranstalter muss jede Anfrage annehmen */
  approvalRequired: boolean;
  /** Zusätzliche (fiktive) Gäste aus den Demo-Daten */
  seedGuests: number;
  createdAt: string;
  cancelled?: boolean;
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type PaymentMode = 'online' | 'door';

export interface DrinkOrder {
  drinkId: string;
  qty: number;
}

export interface Booking {
  id: string;
  partyId: string;
  userId: string;
  userName: string;
  userAge: number;
  status: BookingStatus;
  paymentMode: PaymentMode;
  paymentMethod?: string;
  paid: boolean;
  drinks: DrinkOrder[];
  entryTotal: number;
  drinksTotal: number;
  code: string;
  createdAt: string;
}

export interface Filters {
  music: string[];
  maxPrice: number | null; // null = egal, 0 = nur gratis
  date: 'all' | 'today' | 'weekend' | 'week';
  search: string;
}
