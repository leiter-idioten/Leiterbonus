# Leiterbonus – Plan: Signal-App für XAU/USD (Gold)

> Status: **Entwurf – Planphase.** Noch kein Code. Offene Punkte stehen unten in Abschnitt 11.

## 1. Ziel

Eine lokale, kostenlose Signal-App für **Scalping im Gold-Kurs (XAU/USD)**, die anzeigt:

- **wann** und **zu welchem Kurs** ein Einstieg sinnvoll ist (Long/Short),
- **wo** Stop-Loss und Take-Profit liegen,
- **wie groß** die Position sein darf (Risikomanagement),
- **wie wahrscheinlich** ein Gewinn-Trade ist – basierend auf Backtests, nicht geschätzt,
- **wie die Nachrichtenlage** heute ist (täglicher Briefing durch Claude).

Die App führt **keine Trades aus**. Trades werden manuell in MetaTrader 5 platziert.

## 2. Rahmenbedingungen

| Punkt | Entscheidung |
|---|---|
| Markt | nur XAU/USD |
| Plattform | MetaTrader 5 (Kursquelle + manuelle Ausführung) |
| Stil | Scalping, Haltedauer Sekunden bis Minuten |
| Handelszeit | flexibel (z. B. ab 15:00 Uhr, US-Eröffnung 15:30) |
| Kapital | ca. 200 € |
| Risiko pro Trade | 0,5 – 2 % (Standard: 1 %) |
| Kosten | **0 €** – keine bezahlten APIs, keine Claude-API, kein Server |
| Betrieb | nur lokal auf dem eigenen PC |
| Benachrichtigungen | keine |
| Start | **Demo-Phase** auf einem MT5-Demokonto, bevor echtes Geld eingesetzt wird |

## 3. Täglicher Ablauf

1. **Briefing-Update (vor dem Traden):** In einer Claude-Code-Sitzung sagst du z. B. *„Update fürs Trading heute“*.
   Claude recherchiert Nachrichten und Wirtschaftskalender, schreibt das Tagesbriefing
   (`briefings/JJJJ-MM-TT.json`) ins Repo, ggf. mit Strategie-Anpassungen, und pusht.
2. **Lokal aktualisieren:** `git pull` (oder Doppelklick auf ein Update-Skript).
3. **App starten:** MT5 läuft, dann `start.bat` → Dashboard im Browser (`http://localhost:8501`).
4. **Traden:** App zeigt Signale live; du entscheidest und handelst manuell in MT5.
5. **Tagebuch:** Ausgeführte Trades werden aus MT5 automatisch eingelesen (Historie) und ausgewertet.
6. **Lernen:** Beim nächsten Briefing wertet Claude die gesammelte Statistik aus
   (welche Signale, Uhrzeiten, Nachrichtenlagen funktioniert haben) und passt Parameter an.

Kosten: keine – das Briefing läuft über deine bestehende Claude-Code-Nutzung, nicht über eine API.

## 4. Architektur

```
 MetaTrader 5 (lokal, Demo/Echt)
        │  Python-Paket "MetaTrader5" (kostenlos, liest Live-Ticks + Historie)
        ▼
 ┌──────────────────────────── Leiterbonus (Python, lokal) ───────────────────────────┐
 │  Datensammler ──► SQLite-Datenbank ◄── Briefing-Import (briefings/*.json von Claude) │
 │                        │                                                            │
 │        Indikatoren + Strategie-Regeln ──► Signal-Engine ──► Risiko-Rechner          │
 │                        │                                                            │
 │                 Backtester (Wahrscheinlichkeiten, Kennzahlen)                       │
 │                        ▼                                                            │
 │                 Dashboard (Streamlit, im Browser)                                   │
 └─────────────────────────────────────────────────────────────────────────────────────┘
```

**Technik:** Python 3.12, `MetaTrader5`, `pandas`, `SQLite`, `Streamlit`, `plotly` (Chart). Alles kostenlos.

## 5. Komponenten

### 5.1 Kursdaten (aus MT5)
- Live-Ticks (Bid/Ask, Spread) und Kerzen M1/M5/M15 für XAUUSD.
- Historische Daten (Monate bis Jahre M1) für Backtests – direkt aus dem MT5-Terminal.
- Symbolinfos vom Broker: Mindest-Lot, Kontraktgröße, Spread, Margin – wichtig für korrekte Positionsgrößen.

### 5.2 Tagesbriefing (von Claude, manuell angestoßen)
JSON-Datei pro Tag, z. B.:
- `bias`: bullish / bearish / neutral + Begründung
- `risk_level`: niedrig / mittel / hoch (z. B. hoch bei Fed-Entscheid, Krieg, Eskalation)
- `events`: Termine mit Uhrzeit (US-Arbeitsmarkt, CPI, FOMC, Reden …) → **Sperrzeiten**, in denen die App keine Signale gibt (z. B. ±15 min um High-Impact-News)
- `key_levels`: wichtige Kursmarken (Vortageshoch/-tief, runde Zahlen, Widerstände)
- `notes`: Nachrichtenzusammenfassung (Fed/Zinsen, US-Dollar, Anleihen-Renditen, Geopolitik, Zentralbankkäufe)
- `strategy_overrides`: optionale Anpassungen (z. B. „heute nur Long“, „Risiko halbieren“)

### 5.3 Signal-Engine
- Wertet laufend die Kerzen aus und erzeugt Signale mit: Richtung, Einstiegskurs, Stop-Loss, Take-Profit, Gültigkeitsdauer, Begründung, historische Trefferquote.
- Filtert nach Briefing (Bias, Sperrzeiten, Risikostufe) und nach Spread (bei zu hohem Spread kein Signal).

### 5.4 Risiko-Rechner
- Lotgröße = (Kontostand × Risiko %) ÷ (Stop-Abstand × Wert pro Punkt), abgerundet auf Broker-Lot-Schritt.
- **Warnung**, wenn selbst das Mindest-Lot mehr als das erlaubte Risiko bedeutet → dann **kein Trade**.
- Tagesverlustlimit (Vorschlag: 3 % → danach zeigt die App „Feierabend“).
- Maximal X Trades pro Tag, Mindest-Chance-Risiko-Verhältnis (z. B. 1 : 1,5).

### 5.5 Backtester & Statistik
- Testet jede Strategie auf historischen M1-Daten **inklusive Spread**.
- Kennzahlen: Trefferquote, Ø Gewinn/Verlust, Profit-Faktor, max. Drawdown, Ergebnis nach Uhrzeit/Wochentag.
- Daraus kommt die angezeigte „Wahrscheinlichkeit“ eines Signals.

### 5.6 Trading-Tagebuch
- Liest abgeschlossene Trades aus der MT5-Historie und ordnet sie den Signalen zu.
- Vergleicht Backtest-Erwartung mit Realität (Demo-Phase).

### 5.7 Dashboard (Seiten)
1. **Live:** Chart + aktuelles Signal + Ampel (Handeln / Warten / Sperrzeit) + Spread.
2. **Briefing:** Nachrichtenlage, Termine, Bias.
3. **Risiko-Rechner:** Kontostand, Risiko %, Lot-Vorschlag, Tageslimit.
4. **Statistik/Backtests:** Kennzahlen je Strategie.
5. **Tagebuch:** eigene Trades und Ergebnisse.

## 6. Strategien (Kandidaten – werden erst per Backtest bestätigt)

Claude recherchiert und implementiert gängige Scalping-Ansätze; nur was im Backtest nach Spread positiv ist, wird aktiviert:

1. **Opening-Range-Breakout:** Ausbruch aus der Spanne der ersten Minuten nach London- oder New-York-Eröffnung.
2. **EMA-Trend-Pullback:** Trend auf M5/M15 (z. B. EMA 50/200), Einstieg auf M1 beim Rücksetzer an die EMA 20.
3. **VWAP-Rücklauf:** Rückkehr zum VWAP nach Überdehnung, nur in ruhigen Phasen.
4. **Mean Reversion (Bollinger + RSI) auf M1:** nur bei niedriger Volatilität und neutralem Bias.
5. **Key-Level-Reaktion:** Abpraller/Ausbrüche an Vortageshoch/-tief und runden Zahlen (z. B. xx00, xx50).

## 7. Datenbank (SQLite)

| Tabelle | Inhalt |
|---|---|
| `candles` | Symbol, Zeitrahmen, Zeit, OHLC, Volumen, Spread |
| `briefings` | Datum, Bias, Risikostufe, Notizen, Overrides |
| `events` | Zeit, Name, Wichtigkeit, Sperrfenster |
| `signals` | Zeit, Strategie, Richtung, Entry, SL, TP, Wahrscheinlichkeit, Begründung, Ergebnis |
| `trades` | MT5-Ticket, Zeit, Richtung, Lot, Entry, Exit, Gewinn, zugeordnetes Signal |
| `backtests` | Strategie, Parameter, Zeitraum, Kennzahlen |

## 8. Projektstruktur (geplant)

```
Leiterbonus/
├── PLAN.md
├── README.md
├── requirements.txt
├── start.bat / update.bat
├── briefings/            # tägliche Briefings von Claude (JSON)
├── data/                 # SQLite-Datenbank (nicht im Git)
└── leiterbonus/
    ├── mt5_client.py     # Verbindung zu MetaTrader 5
    ├── collector.py      # Kerzen/Ticks speichern
    ├── db.py
    ├── indicators.py
    ├── strategies/       # eine Datei pro Strategie
    ├── signals.py
    ├── risk.py
    ├── backtest.py
    ├── journal.py
    └── dashboard/        # Streamlit-Seiten
```

## 9. Meilensteine

| # | Inhalt | Ergebnis |
|---|---|---|
| M1 | Grundgerüst, MT5-Verbindung, Datenbank, Kursdaten laden | Live-Kurs + Chart im Dashboard |
| M2 | Risiko-Rechner mit echten Broker-Symbolinfos | korrekter Lot-Vorschlag |
| M3 | Briefing-Format + erstes Tagesbriefing + Sperrzeiten | Briefing-Seite |
| M4 | Indikatoren + 2–3 Strategien + Backtester | Kennzahlen je Strategie |
| M5 | Live-Signal-Engine mit Filtern | Signale im Dashboard |
| M6 | Tagebuch (MT5-Historie) + Statistik | Auswertung Demo-Trades |
| M7 | **Demo-Phase** (Vorschlag: mind. 4 Wochen / 100 Trades) | Entscheidung: Echtgeld ja/nein |

## 10. Was die App nicht kann

- Keine garantierten Vorhersagen – Wahrscheinlichkeiten sind historische Werte und können sich ändern.
- Das Briefing ist so aktuell wie das letzte Update; Ereignisse während der Sitzung erkennt die App nur indirekt (Volatilität, Spread).
- Bei Scalping fressen Spread und Ausführungsverzögerung einen großen Teil des Gewinns – das wird im Backtest berücksichtigt, bleibt aber die größte Hürde.

## 11. Offene Punkte (vor dem Coden zu klären)

1. **Betriebssystem:** Das Python-Paket `MetaTrader5` läuft nur unter **Windows**. Nutzt du Windows?
2. **Hebel / Kontogröße – wichtig:** Bei MT5-Brokern ist Gold fast immer ein CFD **mit Hebel**.
   Das kleinste Lot (0,01) entspricht meist 1 Unze Gold, also einem Positionswert von mehreren tausend USD.
   Ohne Hebel wäre das mit 200 € nicht handelbar; mit EU-üblichem Hebel 1 : 20 bindet bereits 0,01 Lot
   einen großen Teil des Kontos als Margin. Außerdem: 1 % Risiko = 2 € → Stop-Loss nur ca. 2 USD vom
   Einstieg entfernt, wovon der Spread schon einen spürbaren Teil ausmacht.
   → Bitte in MT5 nachsehen: **Broker-Name, Kontotyp, Hebel, Mindest-Lot, typischer Spread bei XAUUSD.**
3. **Demokonto:** Hast du schon ein MT5-Demokonto (kostenlos beim Broker), oder legst du eins an?
4. **Python:** Ist Python installiert, oder soll die Anleitung das mit abdecken?
5. **Handelszeiten:** Sollen Strategien vorerst auf New-York-Eröffnung (ab 15:30) optimiert werden?
