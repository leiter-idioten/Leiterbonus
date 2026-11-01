import L from 'leaflet';
import { useEffect, useState } from 'react';
import { GeoJSON, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import geo from '../data/germany.json';
import { CITIES } from '../data/cities';

/** true im Artefakt-/Offline-Build: eingebaute Vektorkarte statt Online-Kartenkacheln */
export const OFFLINE_MAP = import.meta.env.VITE_OFFLINE_MAP === '1';

export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const neighborStyle = { color: '#3a3a55', weight: 1, fillColor: '#181826', fillOpacity: 1 };
const stateStyle = { color: '#4c3d78', weight: 1.2, fillColor: '#232338', fillOpacity: 1 };

function cityIcon(name: string, big: boolean) {
  return L.divIcon({
    className: 'city-label-wrap',
    html: `<span class="city-label ${big ? 'city-label--big' : ''}">${name}</span>`,
    iconSize: [0, 0],
  });
}

function CityLabels() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const minRank = zoom <= 5 ? 1 : zoom <= 6 ? 2 : zoom <= 7 ? 3 : 4;
  return (
    <>
      {CITIES.filter((c) => c.rank <= minRank).map((c) => (
        <Marker key={c.name} position={[c.lat, c.lng]} icon={cityIcon(c.name, c.rank === 1)} interactive={false} keyboard={false} zIndexOffset={-1000} />
      ))}
    </>
  );
}

function Background() {
  const map = useMap();
  useEffect(() => {
    map.getContainer().classList.add('map--offline');
  }, [map]);
  return null;
}

export function BaseLayer({ labels = true }: { labels?: boolean }) {
  if (!OFFLINE_MAP) return <TileLayer url={TILE_URL} attribution={TILE_ATTR} subdomains="abcd" maxZoom={19} />;
  return (
    <>
      <Background />
      <GeoJSON data={geo.neighbors as GeoJSON.FeatureCollection} style={neighborStyle} interactive={false} />
      <GeoJSON data={geo.states as GeoJSON.FeatureCollection} style={stateStyle} interactive={false} />
      {labels && <CityLabels />}
    </>
  );
}
