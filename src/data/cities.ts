/** Städte für die eingebaute Karte; rank 1 = immer sichtbar, 4 = nur nah herangezoomt */
export const CITIES: { name: string; lat: number; lng: number; rank: number }[] = [
  { name: 'Berlin', lat: 52.52, lng: 13.405, rank: 1 },
  { name: 'Hamburg', lat: 53.551, lng: 9.994, rank: 1 },
  { name: 'München', lat: 48.137, lng: 11.575, rank: 1 },
  { name: 'Köln', lat: 50.938, lng: 6.96, rank: 1 },
  { name: 'Frankfurt', lat: 50.11, lng: 8.682, rank: 1 },
  { name: 'Stuttgart', lat: 48.776, lng: 9.183, rank: 2 },
  { name: 'Düsseldorf', lat: 51.227, lng: 6.773, rank: 2 },
  { name: 'Leipzig', lat: 51.34, lng: 12.375, rank: 2 },
  { name: 'Dortmund', lat: 51.514, lng: 7.468, rank: 3 },
  { name: 'Essen', lat: 51.456, lng: 7.012, rank: 3 },
  { name: 'Bremen', lat: 53.079, lng: 8.802, rank: 2 },
  { name: 'Dresden', lat: 51.05, lng: 13.738, rank: 2 },
  { name: 'Hannover', lat: 52.375, lng: 9.732, rank: 2 },
  { name: 'Nürnberg', lat: 49.452, lng: 11.077, rank: 2 },
  { name: 'Duisburg', lat: 51.435, lng: 6.763, rank: 4 },
  { name: 'Bochum', lat: 51.482, lng: 7.216, rank: 4 },
  { name: 'Wuppertal', lat: 51.256, lng: 7.15, rank: 4 },
  { name: 'Bielefeld', lat: 52.03, lng: 8.532, rank: 3 },
  { name: 'Bonn', lat: 50.737, lng: 7.098, rank: 3 },
  { name: 'Münster', lat: 51.961, lng: 7.626, rank: 3 },
  { name: 'Mannheim', lat: 49.487, lng: 8.466, rank: 3 },
  { name: 'Karlsruhe', lat: 49.007, lng: 8.404, rank: 3 },
  { name: 'Augsburg', lat: 48.371, lng: 10.898, rank: 3 },
  { name: 'Wiesbaden', lat: 50.082, lng: 8.24, rank: 4 },
  { name: 'Mainz', lat: 49.993, lng: 8.247, rank: 3 },
  { name: 'Kiel', lat: 54.323, lng: 10.123, rank: 2 },
  { name: 'Rostock', lat: 54.092, lng: 12.099, rank: 2 },
  { name: 'Magdeburg', lat: 52.12, lng: 11.628, rank: 3 },
  { name: 'Erfurt', lat: 50.978, lng: 11.029, rank: 3 },
  { name: 'Freiburg', lat: 47.999, lng: 7.842, rank: 3 },
  { name: 'Kassel', lat: 51.312, lng: 9.48, rank: 3 },
  { name: 'Saarbrücken', lat: 49.24, lng: 6.997, rank: 3 },
  { name: 'Potsdam', lat: 52.391, lng: 13.065, rank: 4 },
  { name: 'Schwerin', lat: 53.635, lng: 11.401, rank: 4 },
  { name: 'Regensburg', lat: 49.013, lng: 12.101, rank: 3 },
  { name: 'Würzburg', lat: 49.791, lng: 9.953, rank: 4 },
  { name: 'Göttingen', lat: 51.541, lng: 9.916, rank: 4 },
  { name: 'Osnabrück', lat: 52.279, lng: 8.047, rank: 4 },
  { name: 'Aachen', lat: 50.776, lng: 6.084, rank: 3 },
  { name: 'Chemnitz', lat: 50.833, lng: 12.92, rank: 3 },
  { name: 'Lübeck', lat: 53.866, lng: 10.687, rank: 4 },
  { name: 'Oldenburg', lat: 53.144, lng: 8.214, rank: 4 },
  { name: 'Braunschweig', lat: 52.269, lng: 10.521, rank: 4 },
  { name: 'Ulm', lat: 48.401, lng: 9.988, rank: 4 },
  { name: 'Heidelberg', lat: 49.398, lng: 8.672, rank: 4 },
  { name: 'Konstanz', lat: 47.66, lng: 9.175, rank: 4 },
  { name: 'Jena', lat: 50.928, lng: 11.589, rank: 4 },
  { name: 'Halle', lat: 51.482, lng: 11.97, rank: 4 },
  { name: 'Trier', lat: 49.75, lng: 6.637, rank: 4 },
  { name: 'Passau', lat: 48.574, lng: 13.461, rank: 4 },
  { name: 'Flensburg', lat: 54.794, lng: 9.436, rank: 4 },
];

export function nearestCity(lat: number, lng: number): string {
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + ((c.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.name;
}
