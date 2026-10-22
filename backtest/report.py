"""Alle Strategien testen und Kennzahlen als JSON für die Seite schreiben.

Ablauf gegen Überoptimierung:
1. Daten zeitlich teilen: die ersten 70 % zum Auswählen der Parameter (In-Sample),
   die letzten 30 % nur zum Prüfen (Out-of-Sample).
2. Pro Strategie die Parameter mit der besten Erwartung (R pro Trade) im In-Sample wählen.
3. Diese Parameter unverändert auf dem Out-of-Sample testen.
4. Aktiv wird eine Strategie nur, wenn sie Out-of-Sample nach Kosten besteht.

Aufruf:
    python -m backtest.report data/XAUUSD_M1_2024-10-01_2026-10-01.csv.gz --spread 0.30
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

import pandas as pd

from . import engine
from .data_loader import read_csv
from .strategies import ALL

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "backtest" / "results" / "latest.json"

MIN_TRADES_IS = 60
MIN_TRADES_OOS = 50
MIN_PF_OOS = 1.2


def evaluate(df: pd.DataFrame, strat, params: dict, spread: float, slippage: float) -> pd.DataFrame:
    sigs = strat.signals(df, **params)
    return engine.to_frame(engine.run(df, sigs, spread=spread, slippage=slippage))


def by_hour(tr: pd.DataFrame) -> list[dict]:
    if tr.empty:
        return []
    h = tr["entry_time"].dt.tz_convert("Europe/Berlin").dt.hour
    g = tr.assign(h=h, win=tr["pnl_usd"] > 0).groupby("h")
    return [{"stunde": int(k), "trades": int(len(v)), "trefferquote": round(100 * v["win"].mean(), 1), "summe_r": round(v["r"].sum(), 1)}
            for k, v in g]


def run_all(df: pd.DataFrame, spread: float, slippage: float, split: float = 0.7) -> dict:
    cut = df.index[int(len(df) * split)]
    ins, oos = df[df.index < cut], df[df.index >= cut]
    out = []
    for strat in ALL:
        best, best_m = None, None
        tried = []
        for p in strat.PARAMS:
            m = engine.metrics(evaluate(ins, strat, p, spread, slippage))
            tried.append({"params": p, "trades": m["trades"], "erwartung_r": m.get("erwartung_r")})
            if m["trades"] < MIN_TRADES_IS:
                continue
            if best_m is None or m["erwartung_r"] > best_m["erwartung_r"]:
                best, best_m = p, m
        entry = {"name": strat.NAME, "beschreibung": strat.BESCHREIBUNG, "getestet": tried}
        if best is None:
            entry.update({"aktiv": False, "grund": "Zu wenige Trades im Testzeitraum."})
        else:
            tr_oos = evaluate(oos, strat, best, spread, slippage)
            m_oos = engine.metrics(tr_oos)
            pf = m_oos.get("profit_faktor") or 0
            aktiv = m_oos["trades"] >= MIN_TRADES_OOS and pf >= MIN_PF_OOS and m_oos["erwartung_r"] > 0
            grund = "Besteht den Out-of-Sample-Test nach Kosten." if aktiv else (
                f"Out-of-Sample nicht gut genug (Profit-Faktor {pf}, {m_oos['trades']} Trades; nötig ≥ {MIN_PF_OOS} und ≥ {MIN_TRADES_OOS}).")
            entry.update({"aktiv": aktiv, "grund": grund, "params": best, "in_sample": best_m, "out_of_sample": m_oos,
                          "nach_stunde_oos": by_hour(tr_oos)})
        out.append(entry)
    return {
        "erstellt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"),
        "daten": {"von": str(df.index[0]), "bis": str(df.index[-1]), "kerzen": int(len(df)), "trennung": str(cut)},
        "kosten": {"spread_usd": spread, "slippage_usd": slippage},
        "regeln": {"min_trades_oos": MIN_TRADES_OOS, "min_profit_faktor_oos": MIN_PF_OOS},
        "hinweis": "Trefferquoten sind Vergangenheitswerte ohne Nachrichtenfilter. Keine Garantie für die Zukunft.",
        "strategien": out,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--spread", type=float, default=0.30, help="Spread in USD (Broker-Wert zur Handelszeit)")
    ap.add_argument("--slippage", type=float, default=0.05)
    args = ap.parse_args()
    res = run_all(read_csv(Path(args.csv)), args.spread, args.slippage)
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    RESULTS.write_text(json.dumps(res, ensure_ascii=False, indent=2, default=str))
    for s in res["strategien"]:
        o = s.get("out_of_sample", {})
        print(f"{s['name']:<25} aktiv={s['aktiv']!s:<5} OOS: {o.get('trades', 0)} Trades, "
              f"Treffer {o.get('trefferquote')} %, PF {o.get('profit_faktor')}, Erwartung {o.get('erwartung_r')} R")
    print(f"-> {RESULTS}")
