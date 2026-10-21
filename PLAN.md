# Leiterbonus – Plan: Gold-Scalping-Assistent (XAU/USD) fürs Handy

> Status: **Finaler Plan – wartet auf Freigabe.** Erst nach Freigabe wird programmiert.

## 1. Ziel

Ein persönlicher, kostenloser Trading-Assistent für **Scalping in Gold (XAU/USD)**, nutzbar **nur auf dem Handy**, der zeigt:

- **wann** (Uhrzeit) und **zu welchem Kurs** ein Einstieg sinnvoll ist – als konkrete Setups mit Auslöse-Bedingung,
- **wo** Stop-Loss und Take-Profit liegen,
- **wie viel Lot** erlaubt ist (Risikomanagement),
- **wie oft** so ein Setup früher funktioniert hat (Backtest-Trefferquote),
- **wie die Nachrichtenlage** heute ist (Tagesbriefing von Claude).

Die App führt **keine Trades aus** – du handelst selbst in der MetaTrader-5-App.

## 2. Rahmenbedingungen

| Punkt | Entscheidung |
|---|---|
| Markt | nur XAU/USD |
| Gerät | nur Handy (kein PC) |
| Broker-Plattform | MetaTrader 5 App (Chart + manuelle Ausführung) |
| Stil | Scalping, Haltedauer Sekunden bis Minuten |
| Handelszeit | Standard: New-York-Eröffnung (Vorbereitung ab 15:00, Handel ab 15:30); andere Zeiten möglich |
| Kapital | ca. 200 € |
| Risiko pro Trade | 1 % Standard (einstellbar 0,5 – 2 %) |
| Kosten | **0 €** – keine bezahlten APIs, keine Claude-API, kein Server, keine Abos |
| Sichtbarkeit | privat, nur für dich |
| Benachrichtigungen | keine |
| Start | **Demo-Phase** mit MT5-Demokonto, bevor echtes Geld eingesetzt wird |

## 3. Wie das ohne PC funktioniert

Die schwere Arbeit (Nachrichten lesen, Kursdaten laden, Backtests rechnen) passiert **in deiner Claude-Code-Sitzung** in der Cloud.
Das Ergebnis ist eine **private Seite (Claude-Artifact)**, die du auf dem Handy im Browser bzw. in der Claude-App öffnest.

```
  Du (Handy)                       Claude (Claude-Code-Sitzung, Cloud)
  ──────────                       ───────────────────────────────────
  "Update fürs Trading heute"  ──►  1. Nachrichten + Wirtschaftskalender recherchieren
                                    2. Kostenlose Gold-Kursdaten laden (Historie, M1)
                                    3. Backtests der Strategien rechnen (inkl. Spread)
                                    4. Dein Tagebuch auswerten (was hat funktioniert?)
                                    5. Tagesplan erstellen und Seite aktualisieren
  Seite öffnen  ◄──────────────────  private Leiterbonus-Seite (gleicher Link jeden Tag)
  MT5-App: Chart beobachten,
  Setup tritt ein → Trade manuell
  Trade im Tagebuch eintragen  ──►  wird gespeichert, Claude liest es beim nächsten Update
```

**Kosten:** keine – alles läuft über deine bestehende Claude-Nutzung.

**Ehrliche Einschränkung:** Die Seite sieht den Live-Kurs nicht automatisch (das wäre nur mit kostenpflichtigen Datenfeeds oder einem PC mit MT5 zuverlässig).
Darum liefert sie **Setups mit klaren Bedingungen** („Wenn eine 1-Minuten-Kerze über 2.xxx schließt → Long“), die du im MT5-Chart erkennst.
In Meilenstein 1 testen wir, ob ein kostenloser Live-Kurs in der Seite funktioniert – falls ja, kommt er als Extra dazu.

## 4. Die Seite (Aufbau)

1. **Heute** – Ampel (Handeln / Vorsicht / Nicht handeln), Bias (steigend / fallend / neutral), Risikostufe, Countdown bis zur nächsten wichtigen Nachricht.
2. **Setups** – 2–4 konkrete Setups für die Session, jeweils mit:
   - Auslöse-Bedingung und Einstiegskurs
   - Stop-Loss und Take-Profit (Kurs + Abstand)
   - empfohlene Lotgröße
   - Gültigkeit (Uhrzeitfenster)
   - historische Trefferquote + Anzahl getesteter Fälle
   - kurze Begründung
3. **Sperrzeiten** – Zeitfenster um wichtige Nachrichten (z. B. ±15 min um US-Arbeitsmarktdaten, Inflation, Fed), in denen nicht gehandelt wird.
4. **Wichtige Kursmarken** – Vortageshoch/-tief, Tageseröffnung, runde Zahlen, Asien-/London-Spanne.
5. **Risiko-Rechner** – Kontostand + Risiko % + Stop-Abstand → Lotgröße; zeigt, wie viel € ein Trade kosten kann.
6. **Vor-dem-Trade-Checkliste** – Sperrzeit? Spread ok? Tageslimit erreicht? Setup wirklich ausgelöst?
7. **Tagebuch** – Trade eintragen (Uhrzeit, Setup, Long/Short, Lot, Einstieg, Ausstieg, Ergebnis, Notiz). Tagesbilanz + Tageslimit-Anzeige.
8. **Statistik** – deine Trefferquote, Gewinn/Verlust, beste/schlechteste Setups und Uhrzeiten, Backtest vs. Realität.
9. **Nachrichten** – Zusammenfassung der Lage (Fed/Zinsen, US-Dollar, Anleihen-Renditen, Geopolitik, Zentralbank-Goldkäufe) mit Quellen.

## 5. Datenquellen (alle kostenlos)

| Was | Quelle |
|---|---|
| Historische Gold-Kurse (Minuten/Ticks) für Backtests | kostenlose historische Daten, z. B. Dukascopy (XAU/USD Tick/M1), ergänzend Stooq / Yahoo Finance |
| Wirtschaftskalender | öffentliche Kalender (z. B. Forex Factory, Investing.com), offizielle Termine (BLS, Fed) |
| Nachrichten | öffentliche Nachrichtenseiten und Finanz-News (Reuters, Bloomberg-Schlagzeilen, Kitco, FXStreet u. a.) |
| Live-Kurs & Ausführung | deine MT5-App |

Hinweis: Kurse verschiedener Quellen weichen leicht vom Kurs deines Brokers ab (meist wenige Cent bis ca. 1 USD).
Die Seite gibt deshalb Abstände (z. B. „Stop 2,00 USD unter Einstieg“) immer mit an, damit du sie auf den Broker-Kurs übertragen kannst.

## 6. Strategien (Kandidaten – nur was im Backtest besteht, wird genutzt)

1. **Opening-Range-Breakout:** Spanne der ersten 5–15 Minuten nach New-York-Eröffnung, Einstieg beim Ausbruch.
2. **EMA-Trend-Pullback:** Trend auf M5/M15 (EMA 50/200), Einstieg auf M1 beim Rücksetzer an die EMA 20.
3. **VWAP-Rücklauf:** Rückkehr zum VWAP nach Überdehnung, nur in ruhigen Phasen.
4. **Mean Reversion (Bollinger + RSI) auf M1:** nur bei niedriger Volatilität und neutralem Bias.
5. **Key-Level-Reaktion:** Abpraller/Ausbrüche an Vortageshoch/-tief, Asien-/London-Hoch/-Tief und runden Zahlen.

Jede Strategie wird auf mindestens 1–2 Jahren Minutendaten getestet, **mit Spread-Kosten**.
Aktiviert wird sie nur, wenn sie nach Kosten positiv ist (Profit-Faktor > 1,2, genug Fälle).
Die angezeigte „Wahrscheinlichkeit“ ist die historische Trefferquote – keine Garantie.

## 7. Risikomanagement (Regeln)

**Wichtig zu deinen bisherigen Lotgrößen:** Bei Gold entspricht 0,01 Lot meist 1 Unze → 1 USD Kursbewegung ≈ 1 USD Gewinn/Verlust.

| Lot | Verlust bei 2 USD Stop | Anteil an 200 € |
|---|---|---|
| 0,01 | ca. 2 USD | ca. 1 % |
| 0,03 | ca. 6 USD | ca. 3 % |
| 0,05 | ca. 10 USD | ca. 5 % |

→ Mit 200 € und 1 % Risiko ist **0,01 Lot** die passende Größe. 0,03–0,05 Lot entspricht 3–5 % Risiko pro Trade
(und mehr, wenn der Stop weiter weg ist). Vorschlag:

- **Standard 0,01 Lot**, Stop-Loss ca. 1,50 – 3,00 USD, je nach Setup.
- **Max. 2 % Risiko pro Trade** – die Seite warnt, wenn ein Setup mehr verlangt; dann wird es übersprungen.
- **Tagesverlustlimit 4 %** (ca. 8 €) → danach zeigt die Seite „Feierabend“.
- **Max. 5 Trades pro Tag.**
- **Chance-Risiko mind. 1 : 1,5.**
- **Kein Handel in Sperrzeiten** und nicht bei auffällig hohem Spread.
- Größere Lots erst, wenn das Konto wächst (Lot wächst mit dem Kontostand).

## 8. Datenhaltung

| Wo | Was |
|---|---|
| Seite selbst (vom täglichen Update) | Tagesplan, Setups, Kursmarken, Nachrichten, Backtest-Kennzahlen |
| Datenbank der Seite (privat, kostenlos, bleibt bei Updates erhalten) | Tagebuch-Einträge, Einstellungen (Kontostand, Risiko %) |
| GitHub-Repo `Leiterbonus` | Backtest-Skripte, Strategie-Code, Briefing-Archiv, gelernte Parameter – damit bei jedem Update der Stand vom Vortag da ist |

## 9. Projektstruktur im Repo

```
Leiterbonus/
├── PLAN.md
├── README.md
├── briefings/            # Tagesbriefings (JSON), Archiv
├── research/             # Strategie-Notizen + Quellen
├── backtest/
│   ├── data_loader.py    # kostenlose historische Kursdaten laden
│   ├── indicators.py
│   ├── strategies/       # eine Datei pro Strategie
│   ├── engine.py         # Backtest inkl. Spread
│   └── report.py         # Kennzahlen → JSON für die Seite
├── learn/
│   └── params.json       # was aus Tagebuch + Backtests gelernt wurde
└── app/
    └── index.html        # die Handy-Seite (Artifact)
```

## 10. Meilensteine

| # | Inhalt | Ergebnis |
|---|---|---|
| M1 | Seite-Grundgerüst (Handy-Layout), Risiko-Rechner, Checkliste; Test, ob ein kostenloser Live-Kurs möglich ist | erste nutzbare Seite |
| M2 | Tagebuch + Statistik mit Datenbank | Trades eintragen und auswerten |
| M3 | Historische Daten laden + Backtest-Engine + 2–3 Strategien | Trefferquoten je Strategie |
| M4 | Tagesbriefing: Nachrichten, Kalender, Sperrzeiten, Kursmarken, Setups | erstes vollständiges „Update fürs Trading heute“ |
| M5 | Lern-Schleife: Tagebuch auswerten, Parameter anpassen | Update berücksichtigt deine Ergebnisse |
| M6 | **Demo-Phase**: mind. 4 Wochen bzw. 50–100 Trades auf dem Demokonto | Entscheidung: Echtgeld ja/nein |

## 11. Was die App nicht kann

- Keine garantierten Vorhersagen – Trefferquoten sind Vergangenheitswerte.
- Kein automatischer Live-Kurs garantiert (siehe Abschnitt 3); Ereignisse *während* der Session erkennt sie nicht von selbst.
- Das Briefing ist so aktuell wie das letzte Update (gern direkt vor der Session machen).
- Beim Scalping sind Spread und Reaktionszeit am Handy die größten Gegner – das fließt in die Backtests ein.

## 12. Vor dem Start noch zu erledigen (deine Seite)

1. **GitHub-Zugriff für Claude freischalten** (sonst kann der Stand nicht gespeichert werden): GitHub unter https://claude.ai/connect-github verbinden und die Claude-GitHub-App für `leiter-idioten/Leiterbonus` installieren.
2. **Demokonto in der MT5-App** anlegen (kostenlos, meist unter „Konten“ → „+“ → Broker wählen → Demokonto), möglichst beim selben Broker.
3. **Broker-Daten nachschauen** (später reicht auch ein Screenshot):
   - Konten-Übersicht: Broker-Name, Server, Hebel (z. B. „1:30“ / „1:500“)
   - XAUUSD antippen → Eigenschaften/Spezifikation: Kontraktgröße, Mindest-Lot, Lot-Schritt
   - Spread von XAUUSD zur Handelszeit (Differenz zwischen Kauf- und Verkaufskurs)

## 13. Freigabe

Wenn du mit diesem Plan einverstanden bist, schreib einfach **„Plan freigegeben“** – dann starte ich mit Meilenstein 1.
Änderungswünsche gern vorher.
