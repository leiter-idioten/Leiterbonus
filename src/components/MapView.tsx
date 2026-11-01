import L from 'leaflet';
import { Fragment, useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, useMap } from 'react-leaflet';
import { BaseLayer, OFFLINE_MAP } from './BaseLayer';
import type { Booking, Party, User } from '../types';
import { canSeeAddress, euro, fuzzyLocation, isFull, isLive } from '../utils';

export const GERMANY_CENTER: [number, number] = [51.1657, 10.4515];

interface Props {
  parties: Party[];
  bookings: Booking[];
  user: User | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: { lat: number; lng: number; zoom: number; key: number } | null;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function pinIcon(p: Party, opts: { selected: boolean; full: boolean; mine: boolean; going: boolean }) {
  const cls = ['pin', opts.selected && 'pin--selected', isLive(p) && 'pin--live', opts.full && 'pin--full', opts.mine && 'pin--mine', opts.going && 'pin--going']
    .filter(Boolean)
    .join(' ');
  const badge = opts.full ? 'Voll' : euro(p.entryPrice);
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="${cls}"><span class="pin-emoji">${escapeHtml(p.emoji)}</span><span class="pin-badge">${escapeHtml(badge)}</span></div>`,
    iconSize: [56, 64],
    iconAnchor: [28, 58],
  });
}

function FocusController({ focus }: { focus: Props['focus'] }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export function MapView({ parties, bookings, user, selectedId, onSelect, focus }: Props) {
  const items = useMemo(
    () =>
      parties.map((p) => {
        const exact = canSeeAddress(p, user, bookings);
        const pos: [number, number] = exact ? [p.lat, p.lng] : fuzzyLocation(p);
        const going = !!user && bookings.some((b) => b.partyId === p.id && b.userId === user.id && b.status === 'accepted');
        return { p, exact, pos, going, mine: p.hostId === user?.id, full: isFull(p, bookings) };
      }),
    [parties, bookings, user],
  );

  return (
    <MapContainer
      className="map"
      center={GERMANY_CENTER}
      zoom={6}
      minZoom={5}
      maxZoom={OFFLINE_MAP ? 14 : 19}
      maxBounds={[
        [44, -2],
        [58, 23],
      ]}
      zoomControl={false}
      attributionControl
    >
      <BaseLayer />
      <FocusController focus={focus} />
      {items.map(({ p, exact, pos, going, mine, full }) => (
        <Fragment key={p.id}>
          {!exact && (
            <Circle
              center={pos}
              radius={450}
              pathOptions={{ color: '#c084fc', weight: 1, fillColor: '#a855f7', fillOpacity: 0.15 }}
              eventHandlers={{ click: () => onSelect(p.id) }}
            />
          )}
          <Marker
            position={pos}
            icon={pinIcon(p, { selected: p.id === selectedId, full, mine, going })}
            eventHandlers={{ click: () => onSelect(p.id) }}
            zIndexOffset={p.id === selectedId ? 1000 : 0}
          />
        </Fragment>
      ))}
    </MapContainer>
  );
}
