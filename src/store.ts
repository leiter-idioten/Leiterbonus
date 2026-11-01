import { useSyncExternalStore } from 'react';
import { buildDemoData, FAKE_GUESTS } from './demoData';
import type { Booking, DrinkOrder, Party, PaymentMode, User } from './types';
import { ageFrom, drinksTotal, guestCount, hashPassword, isOver, ticketCode, uid } from './utils';

const KEY = 'partymap:db';
const VERSION = 1;

export interface DB {
  version: number;
  users: User[];
  parties: Party[];
  bookings: Booking[];
  sessionUserId: string | null;
}

function fresh(): DB {
  return { version: VERSION, ...buildDemoData(), sessionUserId: null };
}

/** Abgelaufene Demo-Partys bekommen neue Termine, damit die Karte nie leer ist */
function refreshDemoParties(db: DB): DB {
  const demo = buildDemoData();
  const parties = db.parties.map((p) => {
    if (!p.id.startsWith('demo-party-') || !isOver(p)) return p;
    const np = demo.parties.find((x) => x.id === p.id);
    return np ? { ...p, start: np.start, end: np.end } : p;
  });
  const missing = demo.parties.filter((p) => !parties.some((x) => x.id === p.id));
  return { ...db, parties: [...parties, ...missing] };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === VERSION) return refreshDemoParties(parsed);
    }
  } catch {
    /* privater Modus o. ä. – dann eben ohne Speicherung */
  }
  return fresh();
}

let db: DB = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignorieren */
  }
}

function commit(fn: (draft: DB) => void) {
  const next = structuredClone(db);
  fn(next);
  db = next;
  persist();
  listeners.forEach((l) => l());
}

persist();

export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => db,
  );
}

export function getDB(): DB {
  return db;
}

export function currentUser(d: DB = db): User | null {
  return d.users.find((u) => u.id === d.sessionUserId) ?? null;
}

// ---------- Konto ----------

export async function register(input: { name: string; email: string; password: string; birthDate: string }) {
  const email = input.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) throw new Error('Diese E-Mail ist schon registriert.');
  const user: User = {
    id: uid('u-'),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    birthDate: input.birthDate,
    createdAt: new Date().toISOString(),
  };
  commit((d) => {
    d.users.push(user);
    d.sessionUserId = user.id;
  });
}

export async function login(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = db.users.find((u) => u.email === email && !u.isDemoHost);
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error('E-Mail oder Passwort ist falsch.');
  }
  commit((d) => {
    d.sessionUserId = user.id;
  });
}

export async function loginDemo() {
  const email = 'demo@partymap.de';
  if (!db.users.some((u) => u.email === email)) {
    await register({ name: 'Alex Demo', email, password: 'demo1234', birthDate: '2000-04-12' });
  } else {
    await login(email, 'demo1234');
  }
}

export function logout() {
  commit((d) => {
    d.sessionUserId = null;
  });
}

export function resetAll() {
  db = fresh();
  persist();
  listeners.forEach((l) => l());
}

// ---------- Partys ----------

export type PartyInput = Omit<Party, 'id' | 'hostId' | 'hostName' | 'createdAt' | 'seedGuests'>;

export function createParty(input: PartyInput): Party {
  const user = currentUser();
  if (!user) throw new Error('Nicht angemeldet');
  const party: Party = {
    ...input,
    id: uid('p-'),
    hostId: user.id,
    hostName: user.name,
    seedGuests: 0,
    createdAt: new Date().toISOString(),
  };
  commit((d) => {
    d.parties.push(party);
  });
  simulateIncomingRequests(party);
  return party;
}

export function cancelParty(partyId: string) {
  commit((d) => {
    const p = d.parties.find((x) => x.id === partyId);
    if (!p) return;
    p.cancelled = true;
    d.bookings.forEach((b) => {
      if (b.partyId === partyId && (b.status === 'accepted' || b.status === 'pending')) {
        b.status = 'cancelled';
        b.paid = false; // Rückerstattung (simuliert)
      }
    });
  });
}

// ---------- Buchungen ----------

export function bookParty(opts: {
  partyId: string;
  drinks: DrinkOrder[];
  paymentMode: PaymentMode;
  paymentMethod?: string;
}): Booking {
  const user = currentUser();
  if (!user) throw new Error('Nicht angemeldet');
  const party = db.parties.find((p) => p.id === opts.partyId);
  if (!party) throw new Error('Party nicht gefunden');
  const age = ageFrom(user.birthDate);
  if (age < party.minAge) throw new Error(`Diese Party ist erst ab ${party.minAge} Jahren.`);
  if (guestCount(party, db.bookings) >= party.maxGuests) throw new Error('Die Party ist leider ausgebucht.');
  if (db.bookings.some((b) => b.partyId === party.id && b.userId === user.id && ['pending', 'accepted'].includes(b.status))) {
    throw new Error('Du bist schon angemeldet.');
  }

  const status = party.approvalRequired ? 'pending' : 'accepted';
  const booking: Booking = {
    id: uid('b-'),
    partyId: party.id,
    userId: user.id,
    userName: user.name,
    userAge: age,
    status,
    paymentMode: opts.paymentMode,
    paymentMethod: opts.paymentMethod,
    // Bei Freigabe-Partys wird online erst nach Zusage abgebucht
    paid: opts.paymentMode === 'online' && status === 'accepted',
    drinks: opts.drinks.filter((o) => o.qty > 0),
    entryTotal: party.entryPrice,
    drinksTotal: drinksTotal(opts.drinks, party.drinks),
    code: ticketCode(),
    createdAt: new Date().toISOString(),
  };
  commit((d) => {
    d.bookings.push(booking);
  });

  // Demo-Veranstalter antworten automatisch nach ein paar Sekunden
  const host = db.users.find((u) => u.id === party.hostId);
  if (status === 'pending' && host?.isDemoHost) {
    setTimeout(() => respondToBooking(booking.id, true), 4000 + Math.random() * 3000);
  }
  return booking;
}

export function respondToBooking(bookingId: string, accept: boolean) {
  commit((d) => {
    const b = d.bookings.find((x) => x.id === bookingId);
    if (!b || b.status !== 'pending') return;
    const p = d.parties.find((x) => x.id === b.partyId);
    if (accept && p && guestCount(p, d.bookings) >= p.maxGuests) {
      b.status = 'declined';
      return;
    }
    b.status = accept ? 'accepted' : 'declined';
    b.paid = accept && b.paymentMode === 'online';
  });
}

export function cancelBooking(bookingId: string) {
  commit((d) => {
    const b = d.bookings.find((x) => x.id === bookingId);
    if (!b) return;
    b.status = 'cancelled';
    b.paid = false; // Rückerstattung (simuliert)
  });
}

export function markPaidAtDoor(bookingId: string) {
  commit((d) => {
    const b = d.bookings.find((x) => x.id === bookingId);
    if (b) b.paid = true;
  });
}

/** Simuliert Gäste-Anfragen auf neu erstellten Partys, damit man die Gästeliste ausprobieren kann */
function simulateIncomingRequests(party: Party) {
  const pool = FAKE_GUESTS.filter((g) => g.age >= party.minAge).sort(() => Math.random() - 0.5);
  const n = Math.min(3, pool.length, party.maxGuests);
  pool.slice(0, n).forEach((g, i) => {
    setTimeout(() => {
      const p = db.parties.find((x) => x.id === party.id);
      if (!p || p.cancelled || guestCount(p, db.bookings) >= p.maxGuests) return;
      const orders: DrinkOrder[] = p.drinks.length
        ? [{ drinkId: p.drinks[Math.floor(Math.random() * p.drinks.length)].id, qty: 1 + Math.floor(Math.random() * 3) }]
        : [];
      const online = Math.random() > 0.3;
      const status = p.approvalRequired ? 'pending' : 'accepted';
      commit((d) => {
        d.bookings.push({
          id: uid('b-'),
          partyId: p.id,
          userId: 'fake-' + i + '-' + p.id,
          userName: g.name,
          userAge: g.age,
          status,
          paymentMode: online ? 'online' : 'door',
          paymentMethod: online ? 'PayPal' : undefined,
          paid: online && status === 'accepted',
          drinks: orders,
          entryTotal: p.entryPrice,
          drinksTotal: drinksTotal(orders, p.drinks),
          code: ticketCode(),
          createdAt: new Date().toISOString(),
        });
      });
    }, 3000 + i * 4000);
  });
}

// Nach einem Neuladen: offene Anfragen bei Demo-Veranstaltern trotzdem beantworten
setTimeout(() => {
  db.bookings
    .filter((b) => b.status === 'pending')
    .filter((b) => {
      const p = db.parties.find((x) => x.id === b.partyId);
      return db.users.find((u) => u.id === p?.hostId)?.isDemoHost;
    })
    .forEach((b) => respondToBooking(b.id, true));
}, 3000);
