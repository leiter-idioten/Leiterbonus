import L from 'leaflet';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { GERMANY_CENTER, TILE_ATTR, TILE_URL } from '../components/MapView';
import { PAYMENT_METHODS } from '../components/Checkout';
import { createParty } from '../store';
import type { Drink, Party } from '../types';
import { CREATE_FEE, euroExact, MUSIC_GENRES, PARTY_EMOJIS, toLocalInput, uid } from '../utils';

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

const pickIcon = L.divIcon({
  className: 'pin-wrap',
  html: '<div class="pin pin--selected"><span class="pin-emoji">📍</span></div>',
  iconSize: [56, 64],
  iconAnchor: [28, 58],
});

const DRINK_PRESETS: [string, number][] = [
  ['Bier', 2],
  ['Softdrink', 1.5],
  ['Shot', 2],
  ['Longdrink', 5],
  ['Wein (Glas)', 3],
  ['Wasser', 1],
];

function cityFrom(a?: Record<string, string>): string {
  if (!a) return '';
  return a.city || a.town || a.village || a.municipality || a.county || '';
}

function shortAddress(r: GeoResult): string {
  const a = r.address;
  if (!a) return r.display_name;
  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const place = [a.postcode, cityFrom(a)].filter(Boolean).join(' ');
  return [street, a.suburb, place].filter(Boolean).join(', ') || r.display_name;
}

function PickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [pos, map]);
  return null;
}

export function CreateParty({ onCreated }: { onCreated: (p: Party) => void }) {
  const tonight = new Date();
  tonight.setHours(21, 0, 0, 0);
  if (tonight.getTime() < Date.now()) tonight.setDate(tonight.getDate() + 1);

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(toLocalInput(tonight));
  const [end, setEnd] = useState(toLocalInput(new Date(tonight.getTime() + 6 * 3600000)));
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [hideAddress, setHideAddress] = useState(true);
  const [music, setMusic] = useState<string[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [entryPrice, setEntryPrice] = useState('5');
  const [maxGuests, setMaxGuests] = useState('30');
  const [minAge, setMinAge] = useState(18);
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [error, setError] = useState('');
  const [payStep, setPayStep] = useState<null | 'confirm' | 'processing'>(null);
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=de&accept-language=de&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = (await res.json()) as GeoResult[];
      setResults(data);
      if (!data.length) setError('Keine Adresse gefunden. Du kannst den Ort auch direkt auf der Karte antippen.');
      else setError('');
    } catch {
      setError('Adresssuche gerade nicht erreichbar. Tippe den Ort einfach auf der Karte an.');
    } finally {
      setSearching(false);
    }
  };

  const choose = (r: GeoResult) => {
    const p: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
    setPos(p);
    setFlyTo(p);
    setAddress(shortAddress(r));
    setCity(cityFrom(r.address));
    setResults([]);
  };

  const pickOnMap = async (lat: number, lng: number) => {
    setPos([lat, lng]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&accept-language=de&lat=${lat}&lon=${lng}`,
      );
      const r = (await res.json()) as GeoResult;
      if (r?.display_name) {
        setAddress(shortAddress(r));
        setCity(cityFrom(r.address));
      }
    } catch {
      /* Adresse dann manuell eintragen */
    }
  };

  const addDrink = (name = '', price = 2) => setDrinks((d) => [...d, { id: uid('d-'), name, price }]);
  const updateDrink = (id: string, patch: Partial<Drink>) =>
    setDrinks((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'Gib deiner Party einen Namen (mind. 3 Zeichen).';
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Bitte Start und Ende angeben.';
    if (e <= s) return 'Das Ende muss nach dem Start liegen.';
    if (e.getTime() < Date.now()) return 'Die Party muss in der Zukunft liegen.';
    if (!pos) return 'Bitte wähle den Ort auf der Karte oder über die Adresssuche.';
    if (!address.trim()) return 'Bitte gib eine Adresse an.';
    if (!music.length) return 'Wähle mindestens eine Musikrichtung.';
    const price = parseFloat(entryPrice.replace(',', '.'));
    if (isNaN(price) || price < 0 || price > 500) return 'Bitte einen gültigen Eintritt angeben (0 für gratis).';
    const max = parseInt(maxGuests, 10);
    if (isNaN(max) || max < 1 || max > 2000) return 'Bitte eine maximale Gästezahl zwischen 1 und 2000 angeben.';
    if (drinks.some((d) => !d.name.trim() || isNaN(d.price) || d.price < 0)) return 'Jedes Getränk braucht einen Namen und einen Preis.';
    return null;
  };

  const openPayment = () => {
    const err = validate();
    setError(err ?? '');
    if (!err) setPayStep('confirm');
  };

  const publish = () => {
    setPayStep('processing');
    setTimeout(() => {
      const party = createParty({
        title: title.trim(),
        description: description.trim() || 'Kommt vorbei, wird gut!',
        emoji,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        city: city.trim() || 'Unbekannt',
        address: address.trim(),
        lat: pos![0],
        lng: pos![1],
        hideAddress,
        music,
        drinks: drinks.map((d) => ({ ...d, name: d.name.trim() })),
        entryPrice: Math.round(parseFloat(entryPrice.replace(',', '.')) * 100) / 100,
        maxGuests: parseInt(maxGuests, 10),
        minAge,
        approvalRequired,
      });
      setPayStep(null);
      onCreated(party);
    }, 1400);
  };

  return (
    <div className="screen screen--page">
      <div className="page">
        <h1>Party erstellen</h1>
        <p className="muted">Erzähl den Leuten, was sie erwartet. Veröffentlichen kostet einmalig {euroExact(CREATE_FEE)}.</p>

        <div className="card form">
          <label>
            <span>Name der Party</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. WG-Party im Altbau" maxLength={60} />
          </label>
          <div>
            <span className="label">Symbol</span>
            <div className="emoji-pick">
              {PARTY_EMOJIS.map((e) => (
                <button key={e} type="button" className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)} aria-label={`Symbol ${e}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span>Beschreibung</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Was ist das Motto? Was sollen Gäste mitbringen?"
            />
          </label>
          <div className="grid2">
            <label>
              <span>Start</span>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label>
              <span>Ende</span>
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
        </div>

        <h2 className="section-title">Ort</h2>
        <div className="card form">
          <div className="search-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
              placeholder="Adresse suchen, z. B. Hauptstraße 1, Köln"
            />
            <button className="btn" type="button" onClick={search} disabled={searching}>
              {searching ? <span className="spinner" /> : 'Suchen'}
            </button>
          </div>
          {results.length > 0 && (
            <ul className="geo-results">
              {results.map((r) => (
                <li key={r.lat + r.lon}>
                  <button type="button" onClick={() => choose(r)}>
                    {shortAddress(r)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="pick-map">
            <MapContainer center={GERMANY_CENTER} zoom={5} zoomControl={false} attributionControl={false}>
              <TileLayer url={TILE_URL} attribution={TILE_ATTR} subdomains="abcd" />
              <PickHandler onPick={pickOnMap} />
              <Recenter pos={flyTo} />
              {pos && <Marker position={pos} icon={pickIcon} />}
            </MapContainer>
            {!pos && <div className="pick-hint">Tippe auf die Karte, um den Ort zu setzen</div>}
          </div>
          <div className="grid2">
            <label>
              <span>Adresse</span>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße, Hausnr." />
            </label>
            <label>
              <span>Stadt</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Stadt" />
            </label>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={hideAddress} onChange={(e) => setHideAddress(e.target.checked)} />
            <span>
              <strong>Genaue Adresse verstecken</strong>
              <small className="muted">Auf der Karte erscheint nur ein Kreis im Viertel. Die Adresse sehen nur angenommene Gäste.</small>
            </span>
          </label>
        </div>

        <h2 className="section-title">Musik</h2>
        <div className="chips">
          {MUSIC_GENRES.map((m) => {
            const on = music.includes(m);
            return (
              <button
                key={m}
                type="button"
                className={`chip ${on ? 'chip--on' : ''}`}
                onClick={() => setMusic(on ? music.filter((x) => x !== m) : [...music, m])}
              >
                {m}
              </button>
            );
          })}
        </div>

        <h2 className="section-title">Getränke & Snacks</h2>
        <div className="card form">
          {drinks.length === 0 && <p className="muted small">Gäste können Getränke vorab mitbezahlen. Füge deine Getränkekarte hinzu:</p>}
          {drinks.map((d) => (
            <div key={d.id} className="drink-edit">
              <input value={d.name} onChange={(e) => updateDrink(d.id, { name: e.target.value })} placeholder="Getränk" aria-label="Getränk" />
              <div className="price-input">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={Number.isNaN(d.price) ? '' : d.price}
                  onChange={(e) => updateDrink(d.id, { price: parseFloat(e.target.value) })}
                  aria-label="Preis"
                />
                <span>€</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => setDrinks(drinks.filter((x) => x.id !== d.id))} aria-label="Entfernen">
                ✕
              </button>
            </div>
          ))}
          <div className="chips">
            {DRINK_PRESETS.filter(([n]) => !drinks.some((d) => d.name === n)).map(([n, p]) => (
              <button key={n} type="button" className="chip" onClick={() => addDrink(n, p)}>
                + {n}
              </button>
            ))}
            <button type="button" className="chip" onClick={() => addDrink()}>
              + Eigenes
            </button>
          </div>
        </div>

        <h2 className="section-title">Eintritt & Gäste</h2>
        <div className="card form">
          <div className="grid2">
            <label>
              <span>Eintritt</span>
              <div className="price-input">
                <input type="number" inputMode="decimal" min={0} step={0.5} value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
                <span>€</span>
              </div>
              <small className="muted">0 = gratis</small>
            </label>
            <label>
              <span>Max. Gäste</span>
              <input type="number" inputMode="numeric" min={1} value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} />
            </label>
          </div>
          <div>
            <span className="label">Mindestalter</span>
            <div className="segmented">
              {[0, 16, 18, 21, 25].map((a) => (
                <button key={a} type="button" className={minAge === a ? 'active' : ''} onClick={() => setMinAge(a)}>
                  {a === 0 ? 'Keins' : a + '+'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Gästeliste</span>
            <div className="radio-cards">
              <button type="button" className={approvalRequired ? 'on' : ''} onClick={() => setApprovalRequired(true)}>
                <strong>Ich nehme Anfragen an</strong>
                <small>Du entscheidest, wer kommt.</small>
              </button>
              <button type="button" className={!approvalRequired ? 'on' : ''} onClick={() => setApprovalRequired(false)}>
                <strong>Jeder kommt direkt rein</strong>
                <small>Bis die Party voll ist.</small>
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        <button className="btn btn--primary btn--block btn--lg" onClick={openPayment}>
          Weiter zum Veröffentlichen · {euroExact(CREATE_FEE)}
        </button>
        <div className="spacer" />
      </div>

      {payStep &&
        createPortal(
        <div className="modal-wrap">
          <div className="sheet-backdrop" onClick={payStep === 'confirm' ? () => setPayStep(null) : undefined} />
          <section className="modal" role="dialog" aria-label="Party veröffentlichen">
            <header className="modal-head">
              <h2>Party veröffentlichen</h2>
              <button className="icon-btn" onClick={() => setPayStep(null)} disabled={payStep === 'processing'} aria-label="Schließen">
                ✕
              </button>
            </header>
            <div className="preview-card">
              <span className="party-row-emoji">{emoji}</span>
              <div>
                <strong>{title}</strong>
                <div className="muted small">
                  {city} · {new Date(start).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            </div>
            <h3 className="section-title">Bezahlen mit</h3>
            <div className="chips">
              {PAYMENT_METHODS.map((m) => (
                <button key={m} className={`chip ${method === m ? 'chip--on' : ''}`} onClick={() => setMethod(m)}>
                  {m}
                </button>
              ))}
            </div>
            <div className="summary">
              <div>
                <span>Veröffentlichungsgebühr</span>
                <span>{euroExact(CREATE_FEE)}</span>
              </div>
              <div className="summary-total">
                <span>Gesamt</span>
                <span>{euroExact(CREATE_FEE)}</span>
              </div>
            </div>
            <button className="btn btn--primary btn--block" onClick={publish} disabled={payStep === 'processing'}>
              {payStep === 'processing' ? <span className="spinner" /> : `${euroExact(CREATE_FEE)} bezahlen & veröffentlichen`}
            </button>
            <p className="muted tiny center">Prototyp: Zahlung wird nur simuliert. Später ist hier auch ein Abo für Vielveranstalter geplant.</p>
          </section>
        </div>,
          document.body,
        )}
    </div>
  );
}
