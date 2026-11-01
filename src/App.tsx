import { useEffect, useRef, useState } from 'react';
import { PartySheet } from './components/PartySheet';
import { currentUser, useDB } from './store';
import { toast, useToast } from './toast';
import type { Filters, Party } from './types';
import { AuthView } from './views/AuthView';
import { CreateParty } from './views/CreateParty';
import { HostView } from './views/HostView';
import { MapScreen } from './views/MapScreen';
import { ProfileView } from './views/ProfileView';
import { TicketsView } from './views/TicketsView';

type Tab = 'map' | 'tickets' | 'create' | 'host' | 'profile';

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'map', icon: '🗺️', label: 'Karte' },
  { id: 'tickets', icon: '🎟️', label: 'Tickets' },
  { id: 'create', icon: '+', label: 'Erstellen' },
  { id: 'host', icon: '🏠', label: 'Meine Partys' },
  { id: 'profile', icon: '👤', label: 'Profil' },
];

const AUTH_REASON: Partial<Record<Tab, string>> = {
  tickets: 'Melde dich an, um deine Tickets zu sehen.',
  create: 'Melde dich kostenlos an, um eine Party zu erstellen.',
  host: 'Melde dich an, um deine Partys zu verwalten.',
  profile: 'Melde dich an oder registriere dich kostenlos.',
};

export default function App() {
  const db = useDB();
  const user = currentUser(db);
  const message = useToast();
  const [tab, setTab] = useState<Tab>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ music: [], maxPrice: null, date: 'all', search: '' });
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number; key: number } | null>(null);
  // Beim ersten Besuch direkt den Willkommens-/Login-Screen zeigen
  const [auth, setAuth] = useState<string | null>(user ? null : '');
  const pendingTab = useRef<Tab | null>(null);

  // Benachrichtigungen bei Statusänderungen
  const prev = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const next = new Map<string, string>();
    db.bookings.forEach((b) => {
      next.set(b.id, b.status);
      if (!prev.current) return;
      const before = prev.current.get(b.id);
      const party = db.parties.find((p) => p.id === b.partyId);
      if (!party || !user) return;
      if (b.userId === user.id && before === 'pending' && b.status !== 'pending') {
        toast(b.status === 'accepted' ? `🎉 Angenommen für „${party.title}“! Die Adresse ist freigeschaltet.` : `Anfrage für „${party.title}“ abgelehnt`);
      }
      if (party.hostId === user.id && before === undefined && b.userId !== user.id) {
        toast(b.status === 'pending' ? `📩 Neue Anfrage von ${b.userName}` : `🙌 ${b.userName} ist jetzt auf deiner Gästeliste`);
      }
    });
    prev.current = next;
  }, [db.bookings, db.parties, user]);

  const go = (t: Tab) => {
    setSelectedId(null);
    if (t !== 'map' && !user) {
      pendingTab.current = t;
      setAuth(AUTH_REASON[t] ?? '');
      return;
    }
    setTab(t);
  };

  const showOnMap = (p: Party) => {
    setTab('map');
    setSelectedId(p.id);
    setFocus({ lat: p.lat, lng: p.lng, zoom: 14, key: Date.now() });
  };

  const selected = db.parties.find((p) => p.id === selectedId) ?? null;

  // Nach dem Anmelden zum gewünschten Tab, nach dem Abmelden zurück zur Karte
  useEffect(() => {
    if (user && pendingTab.current) {
      setTab(pendingTab.current);
      pendingTab.current = null;
    }
    if (!user && tab !== 'map') setTab('map');
  }, [user, tab]);

  return (
    <div className="app">
      <MapScreen
        db={db}
        filters={filters}
        setFilters={setFilters}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          const p = db.parties.find((x) => x.id === id);
          if (p) setFocus({ lat: p.lat, lng: p.lng, zoom: 13, key: Date.now() });
        }}
        focus={focus}
        setFocus={setFocus}
      />

      {user && tab === 'tickets' && <TicketsView db={db} onExplore={() => setTab('map')} onShowOnMap={showOnMap} />}
      {user && tab === 'create' && (
        <CreateParty
          onCreated={(p) => {
            toast('🎉 Deine Party ist online!');
            showOnMap(p);
          }}
        />
      )}
      {user && tab === 'host' && <HostView db={db} onCreate={() => setTab('create')} onShowOnMap={showOnMap} />}
      {user && tab === 'profile' && <ProfileView db={db} />}

      {selected && tab === 'map' && (
        <PartySheet
          key={selected.id}
          party={selected}
          db={db}
          onClose={() => setSelectedId(null)}
          onLogin={() => setAuth('Melde dich kostenlos an, um bei der Party dabei zu sein.')}
          onOpenTickets={() => go('tickets')}
          onOpenHost={() => go('host')}
        />
      )}

      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${tab === n.id ? 'active' : ''} ${n.id === 'create' ? 'nav-item--create' : ''}`}
            onClick={() => go(n.id)}
            aria-label={n.label}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.id !== 'create' && <span className="nav-label">{n.label}</span>}
          </button>
        ))}
      </nav>

      {auth !== null && !user && <AuthView reason={auth || undefined} onClose={() => {
            setAuth(null);
            if (!currentUser()) pendingTab.current = null;
          }} />}
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}
