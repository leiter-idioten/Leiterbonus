# Tagesbriefings

Pro Handelstag eine Datei `JJJJ-MM-TT.json`. Claude erstellt sie beim „Update fürs Trading heute“
und bettet sie in `app/index.html` (`<script id="briefing">`) ein.

```json
{
  "date": "2026-10-22",
  "updated": "22.10. 14:40",
  "status": "gruen | gelb | rot",
  "headline": "Kurzfassung in einem Satz",
  "summary": "2–3 Sätze zur Lage",
  "bias": { "dir": "bullish | bearish | neutral", "text": "Begründung" },
  "risk_level": "niedrig | mittel | hoch",
  "events": [
    { "time": "2026-10-22T14:30:00Z", "name": "US-Erstanträge Arbeitslosenhilfe", "impact": "mittel",
      "block_before_min": 15, "block_after_min": 15 }
  ],
  "levels": [ { "name": "Vortageshoch", "price": "…" } ],
  "setups": [
    { "name": "Opening-Range-Breakout", "direction": "long | short", "trigger": "…", "entry": "…",
      "sl": "2,00 USD unter Einstieg", "sl_dist": "2,00", "tp": "3,00 USD über Einstieg",
      "window": "15:45–16:30", "winrate": 54, "samples": 212, "reason": "…" }
  ],
  "no_setup_reason": "nur wenn setups leer ist",
  "news": [ { "title": "…", "text": "…", "source": "…", "url": "https://…" } ]
}
```

Zeiten in `events` sind UTC (ISO 8601); die Seite zeigt sie in deutscher Zeit an.
Trades aus dem Tagebuch liegen in der Datenbank der Seite (`trades`), Einstellungen in `settings/konto`.
