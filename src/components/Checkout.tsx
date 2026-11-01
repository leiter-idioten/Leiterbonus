import { useState } from 'react';
import { bookParty } from '../store';
import type { Booking, Party, PaymentMode } from '../types';
import { drinksTotal, euroExact } from '../utils';
import { TicketCode } from './TicketCode';

export const PAYMENT_METHODS = ['PayPal', 'Apple Pay', 'Google Pay', 'Kreditkarte'];

interface Props {
  party: Party;
  onClose: () => void;
  onDone: () => void;
  onOpenTickets: () => void;
}

export function Checkout({ party: p, onClose, onDone, onOpenTickets }: Props) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<PaymentMode>('online');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  const orders = Object.entries(qty).map(([drinkId, q]) => ({ drinkId, qty: q }));
  const drinks = drinksTotal(orders, p.drinks);
  const total = p.entryPrice + drinks;
  const needsPayment = total > 0;

  const change = (id: string, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(20, (q[id] ?? 0) + delta)) }));

  const submit = () => {
    setError('');
    setStep('processing');
    // Simulierte Zahlung – es wird kein echtes Geld bewegt
    setTimeout(
      () => {
        try {
          const b = bookParty({
            partyId: p.id,
            drinks: orders,
            paymentMode: needsPayment ? mode : 'door',
            paymentMethod: needsPayment && mode === 'online' ? method : undefined,
          });
          setBooking(b);
          setStep('done');
        } catch (e) {
          setError((e as Error).message);
          setStep('form');
        }
      },
      needsPayment && mode === 'online' ? 1400 : 500,
    );
  };

  let cta: string;
  if (!needsPayment) cta = p.approvalRequired ? 'Anfrage senden' : 'Auf die Gästeliste';
  else if (mode === 'door') cta = p.approvalRequired ? 'Anfrage senden' : 'Auf die Gästeliste – an der Tür zahlen';
  else if (p.approvalRequired) cta = `Anfrage senden · ${euroExact(total)} reservieren`;
  else cta = `${euroExact(total)} mit ${method} bezahlen`;

  return (
    <div className="modal-wrap">
      <div className="sheet-backdrop" onClick={step === 'processing' ? undefined : onClose} />
      <section className="modal" role="dialog" aria-label="Anmeldung">
        {step === 'done' && booking ? (
          <div className="done">
            <div className="done-emoji">{booking.status === 'accepted' ? '🎉' : '⏳'}</div>
            <h2>{booking.status === 'accepted' ? 'Du bist dabei!' : 'Anfrage gesendet'}</h2>
            <p className="muted">
              {booking.status === 'accepted'
                ? booking.paid
                  ? `Bezahlt mit ${booking.paymentMethod}. Zeig den Code am Eingang.`
                  : needsPayment
                    ? `Du stehst auf der Gästeliste. Bitte ${euroExact(total)} an der Tür bezahlen.`
                    : 'Du stehst auf der Gästeliste.'
                : `${p.hostName} bekommt deine Anfrage. ${
                    booking.paymentMode === 'online' && needsPayment
                      ? `${euroExact(total)} werden erst bei Zusage abgebucht.`
                      : ''
                  } Die genaue Adresse siehst du nach der Zusage.`}
            </p>
            {booking.status === 'accepted' && (
              <div className="done-code">
                <TicketCode code={booking.code} size={140} />
                <div className="code-text">{booking.code}</div>
              </div>
            )}
            <div className="row-actions">
              <button className="btn" onClick={onDone}>
                Schließen
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  onDone();
                  onOpenTickets();
                }}
              >
                Zu meinen Tickets
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="modal-head">
              <h2>{p.approvalRequired ? 'Gästeliste anfragen' : 'Dabei sein'}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Schließen" disabled={step === 'processing'}>
                ✕
              </button>
            </header>
            <div className="muted small">
              {p.emoji} {p.title}
            </div>

            {p.drinks.length > 0 && (
              <>
                <h3 className="section-title">Getränke vorbestellen (optional)</h3>
                <ul className="drink-list drink-list--order">
                  {p.drinks.map((d) => (
                    <li key={d.id}>
                      <div>
                        <div>{d.name}</div>
                        <div className="muted small">{euroExact(d.price)}</div>
                      </div>
                      <div className="stepper">
                        <button onClick={() => change(d.id, -1)} aria-label={`${d.name} weniger`} disabled={!qty[d.id]}>
                          −
                        </button>
                        <span>{qty[d.id] ?? 0}</span>
                        <button onClick={() => change(d.id, 1)} aria-label={`${d.name} mehr`}>
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {needsPayment && (
              <>
                <h3 className="section-title">Bezahlung</h3>
                <div className="segmented">
                  <button className={mode === 'online' ? 'active' : ''} onClick={() => setMode('online')}>
                    Online bezahlen
                  </button>
                  <button className={mode === 'door' ? 'active' : ''} onClick={() => setMode('door')}>
                    An der Tür
                  </button>
                </div>
                {mode === 'online' && (
                  <div className="chips">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m} className={`chip ${method === m ? 'chip--on' : ''}`} onClick={() => setMethod(m)}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="summary">
              <div>
                <span>Eintritt</span>
                <span>{euroExact(p.entryPrice)}</span>
              </div>
              {drinks > 0 && (
                <div>
                  <span>Getränke</span>
                  <span>{euroExact(drinks)}</span>
                </div>
              )}
              <div className="summary-total">
                <span>Gesamt</span>
                <span>{euroExact(total)}</span>
              </div>
            </div>
            {p.approvalRequired && needsPayment && mode === 'online' && (
              <p className="muted small">Der Betrag wird erst abgebucht, wenn {p.hostName} deine Anfrage annimmt.</p>
            )}
            {error && <div className="error">{error}</div>}

            <button className="btn btn--primary btn--block" onClick={submit} disabled={step === 'processing'}>
              {step === 'processing' ? <span className="spinner" /> : cta}
            </button>
            <p className="muted tiny center">Prototyp: Zahlungen werden nur simuliert, es wird kein Geld abgebucht.</p>
          </>
        )}
      </section>
    </div>
  );
}
