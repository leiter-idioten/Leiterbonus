import type { Booking, Party, User } from './types';

function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute);
  return d;
}

/** Tage bis zum nächsten Samstag (0 wenn heute Samstag) */
function toSaturday(): number {
  const day = new Date().getDay();
  return (6 - day + 7) % 7;
}

function hrs(d: Date, h: number): string {
  return new Date(d.getTime() + h * 3600000).toISOString();
}

interface Seed {
  host: string;
  title: string;
  description: string;
  emoji: string;
  start: Date;
  duration: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  hideAddress: boolean;
  music: string[];
  drinks: [string, number][];
  entryPrice: number;
  maxGuests: number;
  minAge: number;
  approvalRequired: boolean;
  seedGuests: number;
}

export const DEMO_PASSWORD_HASH_PLACEHOLDER = '__demo__';

export function buildDemoData(): { users: User[]; parties: Party[]; bookings: Booking[] } {
  const sat = toSaturday();
  const fri = sat === 0 ? 6 : sat - 1;

  const seeds: Seed[] = [
    {
      host: 'Lena K.',
      title: 'WG-Party im Altbau',
      description:
        'Unsere 5er-WG feiert Einstand! Zwei Floors: Küche mit House, Wohnzimmer mit Techno. Bitte Hausschuhe nicht vergessen 😄',
      emoji: '🪩',
      start: at(0, 22),
      duration: 7,
      city: 'Berlin',
      address: 'Wrangelstraße 41, 10997 Berlin-Kreuzberg',
      lat: 52.5009,
      lng: 13.4352,
      hideAddress: true,
      music: ['Techno', 'House'],
      drinks: [
        ['Bier 0,5', 2],
        ['Club-Mate', 2],
        ['Vodka-E', 4],
        ['Gin Tonic', 5],
      ],
      entryPrice: 5,
      maxGuests: 45,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 28,
    },
    {
      host: 'Jonas & Mira',
      title: 'Rooftop Sundowner',
      description: 'Dachterrasse mit Blick auf den Fernsehturm. Erst chillig, später tanzen. Decken liegen bereit.',
      emoji: '🌇',
      start: at(sat, 17),
      duration: 7,
      city: 'Berlin',
      address: 'Simon-Dach-Straße 12, 10245 Berlin-Friedrichshain',
      lat: 52.5107,
      lng: 13.4573,
      hideAddress: true,
      music: ['House', 'Afrobeats', 'Pop'],
      drinks: [
        ['Aperol Spritz', 5],
        ['Bier 0,33', 2],
        ['Limo', 1.5],
      ],
      entryPrice: 8,
      maxGuests: 35,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 20,
    },
    {
      host: 'Kiez Collective',
      title: 'Kiez-Kellerparty',
      description: 'Kellergewölbe, Nebelmaschine, laute Anlage. Hip-Hop und Deutschrap bis die Sonne aufgeht.',
      emoji: '🔊',
      start: at(fri, 23),
      duration: 6,
      city: 'Hamburg',
      address: 'Hein-Hoyer-Straße 22, 20359 Hamburg-St. Pauli',
      lat: 53.5527,
      lng: 9.9606,
      hideAddress: true,
      music: ['Hip-Hop', 'Deutschrap'],
      drinks: [
        ['Astra', 2],
        ['Mexikaner', 1.5],
        ['Jacky-Cola', 5],
      ],
      entryPrice: 3,
      maxGuests: 60,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 41,
    },
    {
      host: 'Tim R.',
      title: '90er/2000er Trash Night',
      description: 'Britney, Backstreet Boys, Scooter. Verkleidung erwünscht, beste Outfit gewinnt einen Kasten!',
      emoji: '🕺',
      start: at(sat, 21),
      duration: 6,
      city: 'Hamburg',
      address: 'Ottenser Hauptstraße 8, 22765 Hamburg-Altona',
      lat: 53.5527,
      lng: 9.9302,
      hideAddress: true,
      music: ['90er/2000er', 'Charts'],
      drinks: [
        ['Bier', 1.5],
        ['Bowle (Becher)', 2],
      ],
      entryPrice: 0,
      maxGuests: 30,
      minAge: 16,
      approvalRequired: false,
      seedGuests: 12,
    },
    {
      host: 'Basti M.',
      title: 'Bierpong-Turnier & Hausparty',
      description: 'Turnier ab 20 Uhr (2er-Teams, Anmeldung vor Ort), danach Party. Gewinnerteam trinkt den Rest der Saison gratis.',
      emoji: '🍻',
      start: at(sat, 20),
      duration: 7,
      city: 'München',
      address: 'Occamstraße 5, 80802 München-Schwabing',
      lat: 48.1617,
      lng: 11.5867,
      hideAddress: true,
      music: ['Charts', 'Pop', 'Deutschrap'],
      drinks: [
        ['Helles', 2.5],
        ['Radler', 2.5],
        ['Spezi', 1.5],
      ],
      entryPrice: 5,
      maxGuests: 40,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 40,
    },
    {
      host: 'Gartenkollektiv Ehrenfeld',
      title: 'Garten-Rave',
      description: 'Lichterketten, Feuertonne, gute Anlage. Wetterfeste Kleidung, es gibt einen überdachten Bereich.',
      emoji: '🎧',
      start: at(fri, 21),
      duration: 8,
      city: 'Köln',
      address: 'Venloer Straße 412, 50825 Köln-Ehrenfeld',
      lat: 50.9502,
      lng: 6.9139,
      hideAddress: true,
      music: ['Techno', 'Elektro'],
      drinks: [
        ['Kölsch', 1.5],
        ['Mate', 2],
        ['Glühwein', 2.5],
      ],
      entryPrice: 7,
      maxGuests: 80,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 52,
    },
    {
      host: 'Paul & Friends',
      title: 'Hinterhof Drum & Bass',
      description: 'Hinterhof in Connewitz, Soundsystem selbst gebaut. Bringt Freunde mit, aber sagt Bescheid.',
      emoji: '🔥',
      start: at(sat, 22),
      duration: 7,
      city: 'Leipzig',
      address: 'Wolfgang-Heinze-Straße 30, 04277 Leipzig-Connewitz',
      lat: 51.3101,
      lng: 12.3788,
      hideAddress: true,
      music: ['Drum & Bass', 'Elektro'],
      drinks: [
        ['Ur-Krostitzer', 2],
        ['Mate', 2],
        ['Pfeffi', 1],
      ],
      entryPrice: 4,
      maxGuests: 70,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 33,
    },
    {
      host: 'Ama O.',
      title: 'Apfelwein & Afrobeats',
      description: 'Frankfurter Apfelwein trifft Lagos. Wir kochen Jollof Rice für alle, die früh kommen!',
      emoji: '🌴',
      start: at(sat, 19),
      duration: 7,
      city: 'Frankfurt',
      address: 'Textorstraße 18, 60594 Frankfurt-Sachsenhausen',
      lat: 50.1009,
      lng: 8.6868,
      hideAddress: true,
      music: ['Afrobeats', 'Reggaeton', 'Hip-Hop'],
      drinks: [
        ['Äppler', 2],
        ['Bier', 2.5],
        ['Rum-Punch', 4],
      ],
      entryPrice: 6,
      maxGuests: 40,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 18,
    },
    {
      host: 'Hüttengaudi Stuttgart',
      title: 'Schlager-Hütte im Keller',
      description: 'Der Partykeller wird zur Skihütte. Dirndl/Lederhose = Freigetränk!',
      emoji: '🎿',
      start: at(sat, 20),
      duration: 6,
      city: 'Stuttgart',
      address: 'Hohenstaufenstraße 9, 70178 Stuttgart-Süd',
      lat: 48.7653,
      lng: 9.1631,
      hideAddress: true,
      music: ['Schlager', 'Charts', '80er'],
      drinks: [
        ['Jägertee', 3],
        ['Bier', 2.5],
        ['Williams', 2],
      ],
      entryPrice: 5,
      maxGuests: 35,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 22,
    },
    {
      host: 'Clara S.',
      title: 'Indie im Wohnzimmer',
      description: 'Plattenspieler, Sofa, gute Gespräche. Kleine Runde, deshalb nur mit Anfrage.',
      emoji: '🎸',
      start: at(1, 20),
      duration: 5,
      city: 'Dresden',
      address: 'Alaunstraße 60, 01099 Dresden-Neustadt',
      lat: 51.0687,
      lng: 13.7546,
      hideAddress: true,
      music: ['Indie', 'Rock'],
      drinks: [
        ['Radeberger', 2],
        ['Rotwein (Glas)', 3],
      ],
      entryPrice: 0,
      maxGuests: 18,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 9,
    },
    {
      host: 'Fachschaft Geo',
      title: 'Semesterstart-Party',
      description: 'Erstis und alle anderen willkommen! Großes Haus, Garten, Grill ab 19 Uhr.',
      emoji: '🎓',
      start: at(fri, 19),
      duration: 8,
      city: 'Münster',
      address: 'Hammer Straße 74, 48153 Münster',
      lat: 51.9489,
      lng: 7.6267,
      hideAddress: true,
      music: ['Charts', 'Pop', 'Hip-Hop'],
      drinks: [
        ['Bier', 1.5],
        ['Wurst vom Grill', 2.5],
        ['Softdrink', 1],
      ],
      entryPrice: 3,
      maxGuests: 100,
      minAge: 16,
      approvalRequired: false,
      seedGuests: 61,
    },
    {
      host: 'Sofía G.',
      title: 'Reggaeton Rooftop',
      description: 'Perreo bis zum Sonnenaufgang auf der Dachterrasse. Dresscode: summer vibes.',
      emoji: '🍹',
      start: at(sat, 22),
      duration: 6,
      city: 'Düsseldorf',
      address: 'Lorettostraße 30, 40219 Düsseldorf-Unterbilk',
      lat: 51.2138,
      lng: 6.7682,
      hideAddress: true,
      music: ['Reggaeton', 'Afrobeats'],
      drinks: [
        ['Mojito', 6],
        ['Corona', 3],
        ['Tequila', 2.5],
      ],
      entryPrice: 10,
      maxGuests: 50,
      minAge: 18,
      approvalRequired: true,
      seedGuests: 31,
    },
    {
      host: 'Marvin B.',
      title: 'Mein 25. – jeder willkommen',
      description: 'Ich werde 25 und will feiern wie mit 18. Bringt gute Laune mit, Geschenke sind optional 🎁',
      emoji: '🎂',
      start: at(0, 20),
      duration: 7,
      city: 'Hannover',
      address: 'Limmerstraße 50, 30451 Hannover-Linden',
      lat: 52.3725,
      lng: 9.7121,
      hideAddress: true,
      music: ['Charts', '90er/2000er', 'House'],
      drinks: [
        ['Bier', 1.5],
        ['Sekt', 2],
        ['Shot', 1],
      ],
      entryPrice: 0,
      maxGuests: 40,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 14,
    },
    {
      host: 'Waldhaus Freiburg',
      title: 'Lagerfeuer & Akustik',
      description: 'Open-Mic am Feuer, bringt Gitarre oder Cajón mit. Danach Stockbrot und leise Elektro.',
      emoji: '🔥',
      start: at(sat, 18),
      duration: 6,
      city: 'Freiburg',
      address: 'Wiehre, Freiburg im Breisgau',
      lat: 47.9839,
      lng: 7.8634,
      hideAddress: false,
      music: ['Akustik', 'Indie'],
      drinks: [
        ['Ganter Bier', 2],
        ['Glühwein', 2.5],
        ['Stockbrot', 1],
      ],
      entryPrice: 2,
      maxGuests: 30,
      minAge: 0,
      approvalRequired: false,
      seedGuests: 11,
    },
    {
      host: 'Kemal Y.',
      title: 'Deutschrap Night',
      description: 'Nur Deutschrap. Von Aggro Berlin bis heute. Mic ist offen ab 1 Uhr.',
      emoji: '🎤',
      start: at(sat + 7, 22),
      duration: 6,
      city: 'Nürnberg',
      address: 'Pirckheimerstraße 40, 90408 Nürnberg',
      lat: 49.4605,
      lng: 11.0807,
      hideAddress: true,
      music: ['Deutschrap', 'Hip-Hop'],
      drinks: [
        ['Tucher', 2],
        ['Wodka-Bull', 4.5],
      ],
      entryPrice: 4,
      maxGuests: 50,
      minAge: 18,
      approvalRequired: false,
      seedGuests: 8,
    },
    {
      host: 'Anke & Uwe',
      title: '80er-Hausparty Ü25',
      description: 'Neonfarben, Schulterpolster, Synthie-Pop. Für alle, die es etwas entspannter mögen.',
      emoji: '📼',
      start: at(sat, 20),
      duration: 6,
      city: 'Bremen',
      address: 'Ostertorsteinweg 20, 28203 Bremen',
      lat: 53.0731,
      lng: 8.8237,
      hideAddress: true,
      music: ['80er', 'Rock', 'Pop'],
      drinks: [
        ['Becks', 2],
        ['Weißwein (Glas)', 3],
        ['Long Island', 6],
      ],
      entryPrice: 5,
      maxGuests: 40,
      minAge: 25,
      approvalRequired: true,
      seedGuests: 17,
    },
  ];

  const users: User[] = [];
  const parties: Party[] = seeds.map((s, i) => {
    let host = users.find((u) => u.name === s.host);
    if (!host) {
      host = {
        id: 'demo-host-' + i,
        name: s.host,
        email: `host${i}@demo.partymap.de`,
        passwordHash: DEMO_PASSWORD_HASH_PLACEHOLDER,
        birthDate: '1996-05-01',
        createdAt: new Date().toISOString(),
        isDemoHost: true,
      };
      users.push(host);
    }
    return {
      id: 'demo-party-' + i,
      hostId: host.id,
      hostName: host.name,
      title: s.title,
      description: s.description,
      emoji: s.emoji,
      start: s.start.toISOString(),
      end: hrs(s.start, s.duration),
      city: s.city,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      hideAddress: s.hideAddress,
      music: s.music,
      drinks: s.drinks.map(([name, price], j) => ({ id: `d${i}-${j}`, name, price })),
      entryPrice: s.entryPrice,
      maxGuests: s.maxGuests,
      minAge: s.minAge,
      approvalRequired: s.approvalRequired,
      seedGuests: s.seedGuests,
      createdAt: new Date().toISOString(),
    };
  });

  return { users, parties, bookings: [] };
}

/** Namen für simulierte Gäste-Anfragen auf eigenen Partys */
export const FAKE_GUESTS = [
  { name: 'Sarah W.', age: 23 },
  { name: 'Deniz A.', age: 26 },
  { name: 'Felix H.', age: 21 },
  { name: 'Noah P.', age: 19 },
  { name: 'Leonie T.', age: 24 },
  { name: 'Emre K.', age: 28 },
  { name: 'Hannah L.', age: 22 },
  { name: 'Luca B.', age: 17 },
];
