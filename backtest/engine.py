"""Backtest-Engine für Scalping-Signale auf Minutenkerzen.

Annahmen (bewusst vorsichtig):
- Kurse sind Bid-Kurse. Long kauft zum Ask (Bid + Spread) und verkauft zum Bid,
  Short umgekehrt. Der Spread kostet also bei jedem Trade.
- Einstieg zum Eröffnungskurs der Kerze NACH dem Signal (keine Kenntnis der Signalkerze vorher).
- Werden Stop-Loss und Take-Profit in derselben Kerze berührt, zählt der Stop-Loss.
- Stop-Loss-Ausführungen bekommen zusätzlich Slippage.
- Immer nur ein Trade gleichzeitig.
- Ergebnisse in USD pro Unze (= pro 0,01 Lot bei Kontraktgröße 100) und in R (Vielfachen des Risikos).
"""
from __future__ import annotations

from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd


@dataclass
class Signal:
    i: int            # Index der Signalkerze (Einstieg bei i + 1)
    direction: int    # +1 Long, -1 Short
    sl_dist: float    # Stop-Abstand in USD
    tp_dist: float    # Take-Profit-Abstand in USD
    max_bars: int = 30  # spätestens nach so vielen Minuten raus


@dataclass
class Trade:
    entry_time: pd.Timestamp
    exit_time: pd.Timestamp
    direction: int
    entry: float
    exit: float
    sl_dist: float
    pnl_usd: float     # pro Unze
    r: float
    reason: str        # "tp", "sl", "zeit"
    bars: int


def run(df: pd.DataFrame, signals: list[Signal], spread: float = 0.30, slippage: float = 0.05) -> list[Trade]:
    o = df["open"].to_numpy()
    h = df["high"].to_numpy()
    lo = df["low"].to_numpy()
    c = df["close"].to_numpy()
    idx = df.index
    n = len(df)
    trades: list[Trade] = []
    busy_until = -1

    for s in sorted(signals, key=lambda x: x.i):
        e = s.i + 1
        if e >= n or e <= busy_until or not (s.sl_dist > 0 and s.tp_dist > 0):
            continue
        d = s.direction
        if d == 1:
            entry = o[e] + spread
            stop, target = entry - s.sl_dist, entry + s.tp_dist
        else:
            entry = o[e]
            stop, target = entry + s.sl_dist, entry - s.tp_dist

        exit_px, reason, j = None, "zeit", e
        last = min(n - 1, e + s.max_bars - 1)
        for j in range(e, last + 1):
            if d == 1:  # Long schließt zum Bid
                hit_sl, hit_tp = lo[j] <= stop, h[j] >= target
                if hit_sl:
                    exit_px, reason = min(stop, o[j]) - slippage, "sl"
                elif hit_tp:
                    exit_px, reason = max(target, o[j]) if j > e else target, "tp"
            else:  # Short schließt zum Ask = Bid + Spread
                hit_sl, hit_tp = h[j] + spread >= stop, lo[j] + spread <= target
                if hit_sl:
                    exit_px, reason = max(stop, o[j] + spread) + slippage, "sl"
                elif hit_tp:
                    exit_px, reason = min(target, o[j] + spread) if j > e else target, "tp"
            if exit_px is not None:
                break
        if exit_px is None:
            j = last
            exit_px = c[j] if d == 1 else c[j] + spread

        pnl = (exit_px - entry) * d
        trades.append(Trade(idx[e], idx[j], d, float(entry), float(exit_px), float(s.sl_dist), float(pnl), float(pnl / s.sl_dist), reason, j - e + 1))
        busy_until = j
    return trades


def to_frame(trades: list[Trade]) -> pd.DataFrame:
    if not trades:
        return pd.DataFrame(columns=[f for f in Trade.__dataclass_fields__])
    return pd.DataFrame([asdict(t) for t in trades])


def metrics(tr: pd.DataFrame) -> dict:
    """Kennzahlen eines Backtests."""
    n = len(tr)
    if n == 0:
        return {"trades": 0}
    wins = tr[tr["pnl_usd"] > 0]
    losses = tr[tr["pnl_usd"] <= 0]
    gross_w, gross_l = wins["pnl_usd"].sum(), -losses["pnl_usd"].sum()
    eq = tr["r"].cumsum()
    dd = (eq - eq.cummax()).min()
    p = len(wins) / n
    # Wilson-Intervall (95 %) für die Trefferquote
    z = 1.96
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    days = tr["entry_time"].dt.date.nunique()
    return {
        "trades": int(n),
        "trades_pro_tag": round(n / max(days, 1), 2),
        "trefferquote": round(100 * p, 1),
        "trefferquote_95": [round(100 * (centre - half), 1), round(100 * (centre + half), 1)],
        "profit_faktor": round(gross_w / gross_l, 2) if gross_l > 0 else None,
        "erwartung_r": round(tr["r"].mean(), 3),
        "summe_r": round(tr["r"].sum(), 1),
        "summe_usd_pro_0_01_lot": round(tr["pnl_usd"].sum(), 1),
        "max_drawdown_r": round(float(dd), 1),
        "stop_median_usd": round(tr["sl_dist"].median(), 2),
        "haltedauer_median_min": int(tr["bars"].median()),
        "ausgang": tr["reason"].value_counts().to_dict(),
    }
