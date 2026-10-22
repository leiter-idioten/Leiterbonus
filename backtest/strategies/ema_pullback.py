"""EMA-Trend-Pullback.

Trend auf M5: EMA 50 über EMA 200 (Long) bzw. darunter (Short), nur aus abgeschlossenen M5-Kerzen.
Einstieg auf M1, wenn der Kurs die EMA 20 (M1) antippt und die Kerze in Trendrichtung wieder davon
weg schließt. Nur in der Kernzeit London/New York (Standard 12–17 Uhr UTC).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..engine import Signal
from ..indicators import atr, ema, higher_tf_ema

NAME = "EMA-Pullback"
BESCHREIBUNG = "Rücksetzer an die EMA 20 (M1) in Richtung des M5-Trends (EMA 50/200)."
PARAMS = [
    {"sl_atr": s, "crv": c, "cooldown": cd}
    for s in (1.0, 1.5)
    for c in (1.5, 2.0)
    for cd in (10, 30)
]


def signals(df: pd.DataFrame, sl_atr: float = 1.0, crv: float = 1.5, cooldown: int = 10,
            hours_utc: tuple[int, int] = (12, 17), max_bars: int = 30) -> list[Signal]:
    c, o, h, lo = (df[k].to_numpy() for k in ("close", "open", "high", "low"))
    e20 = ema(df["close"], 20).to_numpy()
    f = higher_tf_ema(df, "5min", 50).to_numpy()
    s = higher_tf_ema(df, "5min", 200).to_numpy()
    a = atr(df, 14).to_numpy()
    hour = df.index.hour.to_numpy()
    ok = (hour >= hours_utc[0]) & (hour < hours_utc[1]) & np.isfinite(e20) & np.isfinite(f) & np.isfinite(s) & (a > 0)
    long_ = ok & (f > s) & (c > f) & (lo <= e20) & (c > e20) & (c > o)
    short = ok & (f < s) & (c < f) & (h >= e20) & (c < e20) & (c < o)
    out: list[Signal] = []
    last = -10**9
    for i in np.flatnonzero(long_ | short):
        if i - last < cooldown:
            continue
        d = 1 if long_[i] else -1
        sl = sl_atr * a[i]
        out.append(Signal(int(i), d, float(sl), float(sl * crv), max_bars))
        last = i
    return out
