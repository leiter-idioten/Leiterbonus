import { TicketCode } from '../components/TicketCode';
import { cancelBooking, currentUser, type DB } from '../store';
import { toast } from '../toast';
import type { Party } from '../types';
import { euroExact, formatWhen, isOver } from '../utils';

const BADGE = {
  pending: { label: 'Angefragt', cls: 'pending' },
  accepted: { label: 'Bestätigt', cls: 'accepted' },
  declined: { label: 'Abgelehnt', cls: 'declined' },
  cancelled: { label: 'Storniert', cls: 'cancelled' },
} as const;

export function TicketsView({ db, onExplore, onShowOnMap }: { db: DB; onExplore: () => void; onShowOnMap: (p: Party) => void }) {
  const user = currentUser(db);
  const mine = db.bookings
    .filter((b) => b.userId === user?.id)
    .map((b) => ({ b, p: db.parties.find((p) => p.id === b.partyId)! }))
    .filter((x) => x.p)
    .sort((x, y) => {
      const xo = isOver(x.p) || x.b.status === 'cancelled' || x.b.status === 'declined' ? 1 : 0;
      const yo = isOver(y.p) || y.b.status === 'cancelled' || y.b.status === 'declined' ? 1 : 0;
      return xo - yo || x.p.start.localeCompare(y.p.start);
    });

  return (
    <div className="screen screen--page">
      <div className="page">
        <h1>Meine Tickets</h1>
        {mine.length === 0 && (
          <div className="empty">
            <div className="empty-emoji">🎟️</div>
            <h2>Noch keine Tickets</h2>
            <p className="muted">Such dir auf der Karte eine Party aus und trag dich auf die Gästeliste ein.</p>
            <button className="btn btn--primary" onClick={onExplore}>
              Partys entdecken
            </button>
          </div>
        )}
        {mine.map(({ b, p }) => {
          const total = b.entryTotal + b.drinksTotal;
          const active = b.status === 'accepted' && !isOver(p) && !p.cancelled;
          const badge = p.cancelled && b.status === 'cancelled' ? { label: 'Party abgesagt', cls: 'cancelled' } : BADGE[b.status];
          const showAddress = b.status === 'accepted' || !p.hideAddress;
          return (
            <article key={b.id} className={`card ticket ${active ? 'ticket--active' : ''} ${isOver(p) ? 'ticket--past' : ''}`}>
              <div className="ticket-head">
                <span className="party-row-emoji">{p.emoji}</span>
                <div className="party-row-main">
                  <strong>{p.title}</strong>
                  <span className="muted small">{formatWhen(p)}</span>
                </div>
                <span className={`pill pill--${badge.cls}`}>{isOver(p) && b.status === 'accepted' ? 'Vorbei' : badge.label}</span>
              </div>

              <div className="ticket-addr">
                📍 {showAddress ? p.address : `${p.city} – genaue Adresse nach Zusage`}
                {showAddress && active && (
                  <a
                    className="link"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Route
                  </a>
                )}
              </div>

              {active && (
                <div className="ticket-code-wrap">
                  <TicketCode code={b.code} />
                  <div>
                    <div className="code-text">{b.code}</div>
                    <div className="muted small">Zeig diesen Code am Eingang.</div>
                  </div>
                </div>
              )}

              {b.drinks.length > 0 && (
                <ul className="drink-list">
                  {b.drinks.map((o) => {
                    const d = p.drinks.find((x) => x.id === o.drinkId);
                    return (
                      <li key={o.drinkId}>
                        <span>
                          {o.qty}× {d?.name ?? 'Getränk'}
                        </span>
                        <span className="muted">{euroExact((d?.price ?? 0) * o.qty)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="ticket-pay muted small">
                {total === 0
                  ? 'Gratis'
                  : b.status === 'cancelled' || b.status === 'declined'
                    ? b.paymentMode === 'online'
                      ? `${euroExact(total)} – nicht abgebucht / erstattet`
                      : `${euroExact(total)} – entfällt`
                    : b.paid
                      ? `✓ ${euroExact(total)} bezahlt${b.paymentMethod ? ' mit ' + b.paymentMethod : ''}`
                      : b.paymentMode === 'online'
                        ? `${euroExact(total)} reserviert – wird bei Zusage abgebucht`
                        : `${euroExact(total)} an der Tür bezahlen`}
              </div>

              <div className="row-actions">
                {!p.cancelled && !isOver(p) && (
                  <button className="btn btn--sm" onClick={() => onShowOnMap(p)}>
                    Auf Karte
                  </button>
                )}
                {(b.status === 'pending' || b.status === 'accepted') && !isOver(p) && (
                  <button
                    className="btn btn--sm btn--danger"
                    onClick={() => {
                      if (confirm('Anmeldung wirklich stornieren?')) {
                        cancelBooking(b.id);
                        toast('Anmeldung storniert');
                      }
                    }}
                  >
                    Stornieren
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
