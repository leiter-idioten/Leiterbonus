import { ConfirmButton } from '../components/ConfirmButton';
import { currentUser, logout, resetAll, type DB } from '../store';
import { toast } from '../toast';
import { ageFrom, CREATE_FEE, euroExact, initials } from '../utils';

export function ProfileView({ db }: { db: DB }) {
  const user = currentUser(db)!;
  const hosted = db.parties.filter((p) => p.hostId === user.id).length;
  const attended = db.bookings.filter((b) => b.userId === user.id && b.status === 'accepted').length;
  const earned = db.bookings
    .filter((b) => b.paid && b.status === 'accepted' && db.parties.find((p) => p.id === b.partyId)?.hostId === user.id)
    .reduce((s, b) => s + b.entryTotal + b.drinksTotal, 0);

  return (
    <div className="screen screen--page">
      <div className="page">
        <div className="profile-head">
          <div className="avatar avatar--lg">{initials(user.name)}</div>
          <div>
            <h1>{user.name}</h1>
            <div className="muted">
              {user.email} · {ageFrom(user.birthDate)} Jahre
            </div>
          </div>
        </div>

        <div className="stats card">
          <div>
            <strong>{attended}</strong>
            <span>Partys besucht</span>
          </div>
          <div>
            <strong>{hosted}</strong>
            <span>veranstaltet</span>
          </div>
          <div>
            <strong>{euroExact(earned)}</strong>
            <span>eingenommen</span>
          </div>
        </div>

        <h2 className="section-title">Für Veranstalter</h2>
        <div className="card">
          <p>
            <strong>Party veröffentlichen: {euroExact(CREATE_FEE)}</strong>
            <br />
            <span className="muted small">Pro Party, einmalig. Eintritt und Getränke gehen an dich.</span>
          </p>
          <p className="muted small">Demnächst: Abo für Vielveranstalter und Profile für Clubs & Bars.</p>
        </div>

        <h2 className="section-title">Konto</h2>
        <div className="card list-actions">
          <button
            className="btn btn--block"
            onClick={() => {
              logout();
              toast('Abgemeldet');
            }}
          >
            Abmelden
          </button>
          <ConfirmButton
            className="btn btn--block btn--danger"
            confirmLabel="Alles löschen? Nochmal tippen"
            onConfirm={() => {
              resetAll();
              toast('Demo-Daten zurückgesetzt');
            }}
          >
            Demo-Daten zurücksetzen
          </ConfirmButton>
        </div>
        <p className="muted tiny center">PartyMap Prototyp v0.1 · Daten nur lokal in diesem Browser</p>
      </div>
    </div>
  );
}
