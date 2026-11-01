import { useState } from 'react';
import type { DB } from '../store';
import { currentUser } from '../store';
import type { Party } from '../types';
import { ageFrom, canSeeAddress, euro, euroExact, formatWhen, guestCount, isLive, isOver } from '../utils';
import { Checkout } from './Checkout';

interface Props {
  party: Party;
  db: DB;
  onClose: () => void;
  onLogin: () => void;
  onOpenTickets: () => void;
  onOpenHost: () => void;
}

const STATUS_LABEL = {
  pending: '⏳ Anfrage gesendet – wartet auf den Veranstalter',
  accepted: '✅ Du stehst auf der Gästeliste',
  declined: '❌ Anfrage wurde abgelehnt',
  cancelled: 'Storniert',
} as const;

export function PartySheet({ party: p, db, onClose, onLogin, onOpenTickets, onOpenHost }: Props) {
  const user = currentUser(db);
  const [checkout, setCheckout] = useState(false);
  const count = guestCount(p, db.bookings);
  const full = count >= p.maxGuests;
  const over = isOver(p);
  const exact = canSeeAddress(p, user, db.bookings);
  const booking = user
    ? [...db.bookings].reverse().find((b) => b.partyId === p.id && b.userId === user.id && b.status !== 'cancelled')
    : undefined;
  const isHost = user?.id === p.hostId;
  const tooYoung = !!user && ageFrom(user.birthDate) < p.minAge;
  const pct = Math.min(100, Math.round((count / p.maxGuests) * 100));

  let action: JSX.Element;
  if (p.cancelled) action = <button className="btn btn--block" disabled>Abgesagt</button>;
  else if (over) action = <button className="btn btn--block" disabled>Diese Party ist vorbei</button>;
  else if (isHost)
    action = (
      <button className="btn btn--primary btn--block" onClick={onOpenHost}>
        Gästeliste verwalten
      </button>
    );
  else if (booking && booking.status !== 'declined')
    action = (
      <button className="btn btn--primary btn--block" onClick={onOpenTickets}>
        Mein Ticket ansehen
      </button>
    );
  else if (full) action = <button className="btn btn--block" disabled>Ausgebucht</button>;
  else if (!user)
    action = (
      <button className="btn btn--primary btn--block" onClick={onLogin}>
        Kostenlos anmelden & mitmachen
      </button>
    );
  else if (tooYoung)
    action = (
      <button className="btn btn--block" disabled>
        Erst ab {p.minAge} Jahren
      </button>
    );
  else
    action = (
      <button className="btn btn--primary btn--block" onClick={() => setCheckout(true)}>
        {p.approvalRequired ? 'Auf die Gästeliste anfragen' : 'Ich bin dabei'}
        {p.entryPrice > 0 && <span className="btn-sub"> · {euro(p.entryPrice)}</span>}
      </button>
    );

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <section className="sheet" role="dialog" aria-label={p.title}>
        <div className="sheet-handle" onClick={onClose} />
        <button className="icon-btn sheet-close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>

        <header className="party-head">
          <div className="party-emoji">{p.emoji}</div>
          <div>
            <div className="party-meta-top">
              {isLive(p) && !p.cancelled && <span className="live-dot">LIVE</span>}
              <span>{p.city}</span>
            </div>
            <h2>{p.title}</h2>
            <div className="muted">von {p.hostName}</div>
          </div>
        </header>

        <div className="facts">
          <div className="fact">
            <span className="fact-label">Wann</span>
            <span>{formatWhen(p)}</span>
          </div>
          <div className="fact">
            <span className="fact-label">Eintritt</span>
            <span className="fact-strong">{euro(p.entryPrice)}</span>
          </div>
          <div className="fact">
            <span className="fact-label">Wo</span>
            <span>{exact ? p.address : `${p.city} · ungefähre Lage (Adresse nach Zusage)`}</span>
          </div>
          <div className="fact">
            <span className="fact-label">Alter</span>
            <span>{p.minAge > 0 ? `ab ${p.minAge}` : 'alle'}</span>
          </div>
        </div>

        <div className="capacity">
          <div className="capacity-row">
            <span>
              {count} / {p.maxGuests} Gäste
            </span>
            <span className="muted">{p.approvalRequired ? 'Veranstalter nimmt Anfragen an' : 'Direkt auf die Gästeliste'}</span>
          </div>
          <div className="bar">
            <div className={`bar-fill ${pct >= 90 ? 'bar-fill--hot' : ''}`} style={{ width: pct + '%' }} />
          </div>
        </div>

        <p className="desc">{p.description}</p>

        <h3 className="section-title">Musik</h3>
        <div className="chips">
          {p.music.map((m) => (
            <span key={m} className="chip chip--static">
              {m}
            </span>
          ))}
        </div>

        {p.drinks.length > 0 && (
          <>
            <h3 className="section-title">Getränke & Snacks</h3>
            <ul className="drink-list">
              {p.drinks.map((d) => (
                <li key={d.id}>
                  <span>{d.name}</span>
                  <span className="muted">{euroExact(d.price)}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {booking && <div className={`status status--${booking.status}`}>{STATUS_LABEL[booking.status]}</div>}

        <div className="sheet-actions">{action}</div>
      </section>

      {checkout && (
        <Checkout
          party={p}
          onClose={() => setCheckout(false)}
          onDone={() => {
            setCheckout(false);
          }}
          onOpenTickets={onOpenTickets}
        />
      )}
    </>
  );
}
