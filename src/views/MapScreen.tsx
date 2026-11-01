import { useMemo, useState } from 'react';
import { MapView } from '../components/MapView';
import { currentUser, type DB } from '../store';
import { toast } from '../toast';
import type { Filters } from '../types';
import { euro, formatWhen, guestCount, isLive, isOver, matchesFilters, MUSIC_GENRES } from '../utils';

interface Props {
  db: DB;
  filters: Filters;
  setFilters: (f: Filters) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  focus: { lat: number; lng: number; zoom: number; key: number } | null;
  setFocus: (f: { lat: number; lng: number; zoom: number; key: number }) => void;
}

const DATE_OPTIONS: { id: Filters['date']; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'today', label: 'Heute' },
  { id: 'weekend', label: 'Wochenende' },
  { id: 'week', label: '7 Tage' },
];

const PRICE_OPTIONS: { v: number | null; label: string }[] = [
  { v: null, label: 'Egal' },
  { v: 0, label: 'Gratis' },
  { v: 5, label: 'bis 5 €' },
  { v: 10, label: 'bis 10 €' },
  { v: 20, label: 'bis 20 €' },
];

export function MapScreen({ db, filters, setFilters, selectedId, onSelect, focus, setFocus }: Props) {
  const user = currentUser(db);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);

  const visible = useMemo(
    () =>
      db.parties
        .filter((p) => !p.cancelled && !isOver(p) && matchesFilters(p, filters))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [db.parties, filters],
  );

  const activeFilterCount = filters.music.length + (filters.maxPrice !== null ? 1 : 0);

  const locate = () => {
    if (!navigator.geolocation) return toast('Standort wird von deinem Browser nicht unterstützt.');
    navigator.geolocation.getCurrentPosition(
      (pos) => setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 12, key: Date.now() }),
      () => toast('Standort konnte nicht ermittelt werden.'),
      { timeout: 8000 },
    );
  };

  return (
    <div className="screen screen--map">
      <MapView
        parties={visible}
        bookings={db.bookings}
        user={user}
        selectedId={selectedId}
        onSelect={(id) => onSelect(id)}
        focus={focus}
      />

      <div className="map-top">
        <div className="searchbar">
          <span className="search-icon">⌕</span>
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Stadt, Party, Musik …"
            aria-label="Suchen"
          />
          {filters.search && (
            <button className="icon-btn icon-btn--sm" onClick={() => setFilters({ ...filters, search: '' })} aria-label="Suche leeren">
              ✕
            </button>
          )}
          <button className="filter-btn" onClick={() => setShowFilters(true)} aria-label="Filter">
            ☰ Filter{activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
          </button>
        </div>
        <div className="chips chips--scroll">
          {DATE_OPTIONS.map((o) => (
            <button
              key={o.id}
              className={`chip chip--glass ${filters.date === o.id ? 'chip--on' : ''}`}
              onClick={() => setFilters({ ...filters, date: o.id })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-fabs">
        <button className="fab" onClick={locate} aria-label="Mein Standort">
          ◎
        </button>
        <button
          className="fab"
          onClick={() => setFocus({ lat: 51.1657, lng: 10.4515, zoom: 6, key: Date.now() })}
          aria-label="Ganz Deutschland"
        >
          🇩🇪
        </button>
      </div>

      <button className="count-pill" onClick={() => setShowList(true)}>
        {visible.length} {visible.length === 1 ? 'Party' : 'Partys'} · Liste
      </button>

      {showList && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowList(false)} />
          <section className="sheet sheet--list" aria-label="Partyliste">
            <div className="sheet-handle" onClick={() => setShowList(false)} />
            <h2 className="sheet-title">{visible.length} Partys</h2>
            {visible.length === 0 && <p className="muted">Keine Partys für diese Filter. Probier andere Filter aus.</p>}
            <ul className="party-list">
              {visible.map((p) => {
                const count = guestCount(p, db.bookings);
                return (
                  <li key={p.id}>
                    <button
                      className="party-row"
                      onClick={() => {
                        setShowList(false);
                        onSelect(p.id);
                      }}
                    >
                      <span className="party-row-emoji">{p.emoji}</span>
                      <span className="party-row-main">
                        <span className="party-row-title">
                          {isLive(p) && <span className="live-dot">LIVE</span>} {p.title}
                        </span>
                        <span className="muted small">
                          {p.city} · {formatWhen(p)}
                        </span>
                        <span className="muted small">
                          {p.music.join(', ')} · {count}/{p.maxGuests} Gäste
                        </span>
                      </span>
                      <span className="party-row-price">{count >= p.maxGuests ? 'Voll' : euro(p.entryPrice)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {showFilters && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowFilters(false)} />
          <section className="sheet" aria-label="Filter">
            <div className="sheet-handle" onClick={() => setShowFilters(false)} />
            <h2 className="sheet-title">Filter</h2>
            <h3 className="section-title">Musik</h3>
            <div className="chips">
              {MUSIC_GENRES.map((m) => {
                const on = filters.music.includes(m);
                return (
                  <button
                    key={m}
                    className={`chip ${on ? 'chip--on' : ''}`}
                    onClick={() =>
                      setFilters({ ...filters, music: on ? filters.music.filter((x) => x !== m) : [...filters.music, m] })
                    }
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <h3 className="section-title">Eintritt</h3>
            <div className="chips">
              {PRICE_OPTIONS.map((o) => (
                <button
                  key={String(o.v)}
                  className={`chip ${filters.maxPrice === o.v ? 'chip--on' : ''}`}
                  onClick={() => setFilters({ ...filters, maxPrice: o.v })}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <h3 className="section-title">Wann</h3>
            <div className="chips">
              {DATE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  className={`chip ${filters.date === o.id ? 'chip--on' : ''}`}
                  onClick={() => setFilters({ ...filters, date: o.id })}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="row-actions">
              <button className="btn" onClick={() => setFilters({ music: [], maxPrice: null, date: 'all', search: '' })}>
                Zurücksetzen
              </button>
              <button className="btn btn--primary" onClick={() => setShowFilters(false)}>
                {visible.length} Partys anzeigen
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
