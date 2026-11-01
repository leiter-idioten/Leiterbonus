import { useState, type FormEvent } from 'react';
import { login, loginDemo, register } from '../store';
import { ageFrom } from '../utils';

export function AuthView({ onClose, reason }: { onClose?: () => void; reason?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('Bitte gib deinen Namen ein.');
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Bitte gib eine gültige E-Mail ein.');
        if (password.length < 6) throw new Error('Das Passwort braucht mindestens 6 Zeichen.');
        if (!birthDate) throw new Error('Bitte gib dein Geburtsdatum an.');
        const age = ageFrom(birthDate);
        if (age < 16) throw new Error('Du musst mindestens 16 Jahre alt sein.');
        if (age > 110) throw new Error('Bitte prüfe dein Geburtsdatum.');
        setBusy(true);
        await register({ name, email, password, birthDate });
      } else {
        setBusy(true);
        await login(email, password);
      }
      onClose?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    await loginDemo();
    setBusy(false);
    onClose?.();
  };

  return (
    <div className="auth">
      {onClose && (
        <button className="icon-btn auth-close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      )}
      <div className="auth-inner">
        <div className="logo">
          <img src="./icon.svg" alt="" width={56} height={56} />
          <span>PartyMap</span>
        </div>
        <p className="auth-claim">{reason ?? 'Finde Hauspartys in deiner Nähe – oder schmeiß selbst eine.'}</p>

        <div className="segmented">
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Registrieren
          </button>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Anmelden
          </button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'register' && (
            <label>
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname N." autoComplete="name" />
            </label>
          )}
          <label>
            <span>E-Mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              autoComplete="email"
            />
          </label>
          <label>
            <span>Passwort</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mind. 6 Zeichen"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'register' && (
            <label>
              <span>Geburtsdatum</span>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              <small className="muted">Wird für Partys mit Altersgrenze benötigt.</small>
            </label>
          )}
          {error && <div className="error">{error}</div>}
          <button className="btn btn--primary btn--block" disabled={busy}>
            {mode === 'register' ? 'Kostenlos registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="divider">oder</div>
        <button className="btn btn--block" onClick={demo} disabled={busy}>
          Mit Demo-Konto ausprobieren
        </button>
        {onClose && (
          <button className="link-btn" onClick={onClose}>
            Erstmal nur umschauen
          </button>
        )}
        <p className="muted tiny center">Prototyp: Alle Daten werden nur lokal in deinem Browser gespeichert.</p>
      </div>
    </div>
  );
}
