# PartyMap 🎉

Prototyp einer App, die Leute, die nach Partys suchen, mit Leuten verbindet, die (Haus-)Partys veranstalten.
Auf einer Deutschlandkarte sieht man alle Partys in der Nähe, kann sich auf die Gästeliste setzen lassen,
Eintritt und Getränke online bezahlen oder selbst eine Party erstellen.

> **Prototyp:** Alle Daten liegen nur lokal im Browser (localStorage). Zahlungen werden nur simuliert, es wird kein Geld bewegt.

## Funktionen

**Für Gäste**
- Kostenlos registrieren (Name, E-Mail, Passwort, Geburtsdatum) oder Demo-Konto nutzen; umschauen geht auch ohne Konto
- Karte im Snapchat-Stil mit allen Partys in Deutschland, Listenansicht, Suche
- Filter nach Musik, Eintritt und Datum (Heute / Wochenende / 7 Tage)
- Party-Details: Zeit, Eintritt, Musik, Getränkekarte, Altersgrenze, Gäste x/max
- Auf die Gästeliste: direkt oder per Anfrage, Getränke vorbestellen, online bezahlen (PayPal, Apple Pay, Google Pay, Karte – simuliert) oder an der Tür zahlen
- Bei Partys mit Freigabe wird erst nach der Zusage abgebucht
- Tickets mit Code für den Eingang, Route zur Party, Stornieren

**Für Veranstalter**
- Party erstellen: Name, Symbol, Beschreibung, Start/Ende, Ort (Adresssuche oder Tippen auf die Karte), Musik, Getränke mit Preisen, Eintritt, max. Gäste, Mindestalter
- Wahl pro Party: Jeder kommt direkt rein oder der Veranstalter nimmt Anfragen an
- **Privatsphäre:** Optional nur ungefähre Lage (Kreis im Viertel); die genaue Adresse sehen nur angenommene Gäste
- Veröffentlichen kostet 10 € (simuliert)
- „Meine Partys“: Anfragen annehmen/ablehnen, Gästeliste, Bezahlstatus, Einnahmen, Summe der vorbestellten Getränke, Party absagen (Gäste werden erstattet)

**Damit man alles allein ausprobieren kann**
- 16 Demo-Partys in ganz Deutschland, Termine immer relativ zu heute
- Demo-Veranstalter nehmen Anfragen nach ein paar Sekunden automatisch an
- Eigene neue Partys bekommen nach ein paar Sekunden simulierte Gäste-Anfragen

## Starten

```bash
npm install
npm run dev
```

Dann im Browser `http://localhost:5173` öffnen. Zum Testen auf dem Handy (im selben WLAN) die angezeigte
`Network`-Adresse öffnen. Über „Zum Home-Bildschirm hinzufügen“ lässt sich die App wie eine echte App starten.

Produktions-Build: `npm run build` (Ausgabe in `dist/`).

## Online stellen (GitHub Pages)

Der Workflow `.github/workflows/pages.yml` baut und veröffentlicht die App bei jedem Push auf `main`.
Einmalig unter **Settings → Pages → Build and deployment → Source: GitHub Actions** einschalten.

## Technik

- React 18 + TypeScript + Vite
- Karte: Leaflet / react-leaflet, Kartendaten © OpenStreetMap, Kacheln © CARTO
- Adresssuche: OpenStreetMap Nominatim
- Speicherung: localStorage (`src/store.ts`)

```
src/
  App.tsx              Navigation & Bildschirme
  store.ts             Daten & Aktionen (Konto, Partys, Buchungen)
  demoData.ts          Demo-Partys
  utils.ts             Filter, Preise, Datum, Privatsphäre-Versatz
  components/          Karte, Party-Details, Checkout, Ticket-Code
  views/               Login, Party erstellen, Meine Partys, Tickets, Profil
```

## Nächste Schritte (Ideen)

1. Echtes Backend (z. B. Supabase): gemeinsame Daten für alle, echte Accounts, Benachrichtigungen
2. Echte Zahlungen mit Auszahlung an Veranstalter (z. B. Stripe Connect), Plattformgebühr, Abo-Modell
3. Altersverifikation (Ausweis-Check), Melden/Blockieren, Bewertungen für Veranstalter
4. Chat zwischen Gast und Veranstalter, Ticket-Scan am Eingang
5. Profile für Clubs & Bars
6. Native App (z. B. React Native / Capacitor) für App Store und Play Store
