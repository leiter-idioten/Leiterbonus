import { useState } from 'react';
import { cancelParty, currentUser, markPaidAtDoor, respondToBooking, type DB } from '../store';
import { toast } from '../toast';
import type { Booking, Party } from '../types';
import { euro, euroExact, formatWhen, guestCount, isOver } from '../utils';

interface Props {
  db: DB;
  onCreate: () => void;
  onShowOnMap: (p: Party) => void;
}

function drinkSummary(p: Party, bookings: Booking[]) {
  const totals = new Map<string, number>();
  bookings.forEach((b) => b.drinks.forEach((o) => totals.set(o.drinkId, (totals.get(o.drinkId) ?? 0) + o.qty)));
  return p.drinks.filter((d) => totals.get(d.id)).map((d) => ({ name: d.name, qty: totals.get(d.id)! }));
}

function GuestRow({ b, party, showPayToggle }: { b: Booking; party: Party; showPayToggle: boolean }) {
  const total = b.entryTotal + b.drinksTotal;
  const underage = b.userAge < party.minAge;
  return (
    <li className="guest">
      <div className="avatar">{b.userName.slice(0, 1)}</div>
      <div className="guest-main">
        <div>
          {b.userName} <span className={`muted small ${underage ? 'warn' : ''}`}>· {b.userAge} J.</span>
        </div>
        <div className="muted small">
          {total > 0
            ? b.paid
              ? `✓ ${euroExact(total)} bezahlt${b.paymentMethod ? ' (' + b.paymentMethod + ')' : ''}`
              : b.paymentMode === 'online'
                ? `${euroExact(total)} online, wird bei Zusage abgebucht`
                : `${euroExact(total)} an der Tür offen`
            : 'Gratis'}
          {b.drinks.length > 0 && ` · ${b.drinks.reduce((s, o) => s + o.qty, 0)} Getränke`}
        </div>
      </div>
      {showPayToggle && !b.paid && total > 0 && (
        <button className="btn btn--sm" onClick={() => markPaidAtDoor(b.id)}>
          Bezahlt
        </button>
      )}
    </li>
  );
}

function HostPartyCard({ p, db, onShowOnMap }: { p: Party; db: DB; onShowOnMap: (p: Party) => void }) {
  const [open, setOpen] = useState(!isOver(p) && !p.cancelled);
  const bookings = db.bookings.filter((b) => b.partyId === p.id);
  const pending = bookings.filter((b) => b.status === 'pending');
  const accepted = bookings.filter((b) => b.status === 'accepted');
  const count = guestCount(p, db.bookings);
  const full = count >= p.maxGuests;
  const paidOnline = accepted.filter((b) => b.paid && b.paymentMode === 'online').reduce((s, b) => s + b.entryTotal + b.drinksTotal, 0);
  const paidDoor = accepted.filter((b) => b.paid && b.paymentMode === 'door').reduce((s, b) => s + b.entryTotal + b.drinksTotal, 0);
  const openDoor = accepted.filter((b) => !b.paid).reduce((s, b) => s + b.entryTotal + b.drinksTotal, 0);
  const drinks = drinkSummary(p, accepted);
  const over = isOver(p);

  return (
    <article className={`card host-card ${p.cancelled || over ? 'host-card--past' : ''}`}>
      <button className="host-card-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="party-row-emoji">{p.emoji}</span>
        <span className="party-row-main">
          <span className="party-row-title">{p.title}</span>
          <span className="muted small">
            {p.cancelled ? 'Abgesagt' : over ? 'Vorbei' : formatWhen(p)} · {p.city}
          </span>
        </span>
        {pending.length > 0 && <span className="badge badge--big">{pending.length}</span>}
        <span className="chev">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="host-card-body">
          <div className="stats">
            <div>
              <strong>
                {count}/{p.maxGuests}
              </strong>
              <span>Gäste</span>
            </div>
            <div>
              <strong>{pending.length}</strong>
              <span>Anfragen</span>
            </div>
            <div>
              <strong>{euroExact(paidOnline + paidDoor)}</strong>
              <span>eingenommen</span>
            </div>
            <div>
              <strong>{euroExact(openDoor)}</strong>
              <span>offen (Tür)</span>
            </div>
          </div>

          <div className="muted small">
            Eintritt {euro(p.entryPrice)} · {p.minAge ? `ab ${p.minAge}` : 'ohne Altersgrenze'} ·{' '}
            {p.approvalRequired ? 'mit Freigabe' : 'ohne Freigabe'} · {p.hideAddress ? 'Adresse versteckt' : 'Adresse öffentlich'}
          </div>

          {pending.length > 0 && (
            <>
              <h3 className="section-title">Offene Anfragen</h3>
              <ul className="guest-list">
                {pending.map((b) => (
                  <li key={b.id} className="guest">
                    <div className="avatar">{b.userName.slice(0, 1)}</div>
                    <div className="guest-main">
                      <div>
                        {b.userName} <span className="muted small">· {b.userAge} J.</span>
                      </div>
                      <div className="muted small">
                        {b.paymentMode === 'online' ? 'zahlt online' : 'zahlt an der Tür'}
                        {b.drinks.length > 0 && ` · ${b.drinks.reduce((s, o) => s + o.qty, 0)} Getränke vorbestellt`}
                      </div>
                    </div>
                    <div className="guest-actions">
                      <button
                        className="btn btn--sm"
                        onClick={() => {
                          respondToBooking(b.id, false);
                          toast(`${b.userName} abgelehnt`);
                        }}
                        aria-label={`${b.userName} ablehnen`}
                      >
                        ✕
                      </button>
                      <button
                        className="btn btn--sm btn--primary"
                        disabled={full}
                        onClick={() => {
                          respondToBooking(b.id, true);
                          toast(`${b.userName} ist auf der Gästeliste 🎉`);
                        }}
                        aria-label={`${b.userName} annehmen`}
                      >
                        Annehmen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {full && <p className="muted small">Die Party ist voll – erhöhe die Gästezahl oder lehne Anfragen ab.</p>}
            </>
          )}

          <h3 className="section-title">Gästeliste ({accepted.length})</h3>
          {accepted.length === 0 ? (
            <p className="muted small">Noch keine Gäste über die App. {p.seedGuests > 0 && `(${p.seedGuests} Demo-Gäste)`}</p>
          ) : (
            <ul className="guest-list">
              {accepted.map((b) => (
                <GuestRow key={b.id} b={b} party={p} showPayToggle={!p.cancelled} />
              ))}
            </ul>
          )}

          {drinks.length > 0 && (
            <>
              <h3 className="section-title">Vorbestellte Getränke</h3>
              <ul className="drink-list">
                {drinks.map((d) => (
                  <li key={d.name}>
                    <span>{d.name}</span>
                    <strong>{d.qty}×</strong>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="row-actions">
            {!p.cancelled && !over && (
              <button className="btn" onClick={() => onShowOnMap(p)}>
                Auf Karte zeigen
              </button>
            )}
            {!p.cancelled && !over && (
              <button
                className="btn btn--danger"
                onClick={() => {
                  if (confirm('Party wirklich absagen? Alle Gäste werden storniert und bekommen ihr Geld zurück.')) {
                    cancelParty(p.id);
                    toast('Party abgesagt');
                  }
                }}
              >
                Absagen
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function HostView({ db, onCreate, onShowOnMap }: Props) {
  const user = currentUser(db);
  const mine = db.parties
    .filter((p) => p.hostId === user?.id)
    .sort((a, b) => {
      const ao = a.cancelled || isOver(a) ? 1 : 0;
      const bo = b.cancelled || isOver(b) ? 1 : 0;
      return ao - bo || a.start.localeCompare(b.start);
    });

  return (
    <div className="screen screen--page">
      <div className="page">
        <h1>Meine Partys</h1>
        {mine.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">🏠</div>
            <h2>Noch keine Party veranstaltet</h2>
            <p className="muted">Erstell deine erste Party, leg Eintritt und Getränkepreise fest und verdien ein bisschen was dazu.</p>
            <button className="btn btn--primary" onClick={onCreate}>
              Party erstellen
            </button>
          </div>
        ) : (
          <>
            <p className="muted small">Neue Partys bekommen im Prototyp nach ein paar Sekunden simulierte Gäste-Anfragen, damit du die Gästeliste ausprobieren kannst.</p>
            {mine.map((p) => (
              <HostPartyCard key={p.id} p={p} db={db} onShowOnMap={onShowOnMap} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
