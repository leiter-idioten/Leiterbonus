import type { Booking, Drink, DrinkOrder, Filters, Party, User } from './types';

export const MUSIC_GENRES = [
  'Techno',
  'House',
  'Hip-Hop',
  'Deutschrap',
  'Charts',
  'Pop',
  '90er/2000er',
  '80er',
  'Schlager',
  'Rock',
  'Indie',
  'Drum & Bass',
  'Reggaeton',
  'Afrobeats',
  'Elektro',
  'Akustik',
];

export const PARTY_EMOJIS = ['🎉', '🪩', '🔊', '🍻', '🏠', '🌇', '🔥', '🎧', '🍹', '🎸', '🌴', '🎂'];

export const CREATE_FEE = 10;

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function ticketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s.slice(0, 3) + '-' + s.slice(3);
}

export function euro(n: number): string {
  if (n === 0) return 'Gratis';
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

export function euroExact(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

export function ageFrom(birthDate: string, at = new Date()): number {
  const b = new Date(birthDate + 'T00:00:00');
  let age = at.getFullYear() - b.getFullYear();
  const m = at.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < b.getDate())) age--;
  return age;
}

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode('partymap:' + pw);
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback (z. B. unsicherer Kontext über http im LAN)
  let h = 0;
  for (const c of data) h = (h * 31 + c) | 0;
  return 'x' + h.toString(16);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function formatWhen(p: Pick<Party, 'start' | 'end'>): string {
  return `${formatDay(p.start)}, ${formatTime(p.start)} – ${formatTime(p.end)} Uhr`;
}

export function isLive(p: Party, now = Date.now()): boolean {
  return new Date(p.start).getTime() <= now && new Date(p.end).getTime() > now;
}

export function isOver(p: Party, now = Date.now()): boolean {
  return new Date(p.end).getTime() <= now;
}

/** Gäste, die einen Platz belegen (angenommen + Demo-Gäste) */
export function guestCount(p: Party, bookings: Booking[]): number {
  return p.seedGuests + bookings.filter((b) => b.partyId === p.id && b.status === 'accepted').length;
}

export function isFull(p: Party, bookings: Booking[]): boolean {
  return guestCount(p, bookings) >= p.maxGuests;
}

export function drinksTotal(orders: DrinkOrder[], drinks: Drink[]): number {
  return orders.reduce((sum, o) => {
    const d = drinks.find((x) => x.id === o.drinkId);
    return sum + (d ? d.price * o.qty : 0);
  }, 0);
}

/** Darf der Nutzer die genaue Adresse sehen? */
export function canSeeAddress(p: Party, user: User | null, bookings: Booking[]): boolean {
  if (!p.hideAddress) return true;
  if (!user) return false;
  if (p.hostId === user.id) return true;
  return bookings.some((b) => b.partyId === p.id && b.userId === user.id && b.status === 'accepted');
}

/** Deterministischer Versatz (~150–350 m), damit der Kreis nicht genau auf der Wohnung liegt */
export function fuzzyLocation(p: Party): [number, number] {
  let h = 0;
  for (const c of p.id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const angle = ((h % 360) * Math.PI) / 180;
  const dist = 150 + (h % 200); // Meter
  const dLat = (dist * Math.cos(angle)) / 111320;
  const dLng = (dist * Math.sin(angle)) / (111320 * Math.cos((p.lat * Math.PI) / 180));
  return [p.lat + dLat, p.lng + dLng];
}

export function matchesFilters(p: Party, f: Filters): boolean {
  if (f.music.length && !p.music.some((m) => f.music.includes(m))) return false;
  if (f.maxPrice !== null && p.entryPrice > f.maxPrice) return false;
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    const hay = [p.title, p.city, p.description, p.hostName, ...p.music].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.date !== 'all') {
    const now = new Date();
    const start = new Date(p.start);
    const end = new Date(p.end);
    const today = startOfDay(now);
    if (f.date === 'today') {
      const tomorrow = new Date(today.getTime() + 86400000);
      // läuft gerade oder startet heute (bis 6 Uhr früh am nächsten Tag zählt noch als heute)
      if (!(start < new Date(tomorrow.getTime() + 6 * 3600000) && end > now)) return false;
    } else if (f.date === 'week') {
      if (start.getTime() > today.getTime() + 8 * 86400000) return false;
    } else if (f.date === 'weekend') {
      // kommendes Wochenende: Freitag 12 Uhr bis Montag 6 Uhr
      const day = today.getDay(); // 0 = So
      const daysToFri = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
      const fri = new Date(today.getTime() + daysToFri * 86400000 + 12 * 3600000);
      const mon = new Date(fri.getTime() + 2.75 * 86400000);
      if (!(start < mon && end > fri)) return false;
    }
  }
  return true;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
