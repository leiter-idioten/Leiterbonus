"""Mean Reversion mit Bollinger-Bändern und RSI auf M1.

Kurs schließt außerhalb des Bollinger-Bands (20, k) und RSI(7) ist extrem -> Gegenbewegung.
Nur in ruhigen Phasen: ATR unter seinem gleitenden Median (sonst läuft der Trend einfach weiter).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from ..engine import Signal
from ..indicators import atr, bollinger, rsi

NAME = "Mean Reversion"
BESCHREIBUNG = "Gegenbewegung nach Überdehnung außerhalb der Bollinger-Bänder bei extremem RSI, nur in ruhigen Phasen."
PARAMS = [
    {"k": k, "rsi_lim": r, "crv": c}
    for k in (2.0, 2.5)
    for r in (15, 25)
    for c in (1.0, 1.5)
]


def signals(df: pd.DataFrame, k: float = 2.0, rsi_lim: float = 20, crv: float = 1.5, sl_atr: float = 1.0,
            hours_utc: tuple[int, int] = (7, 20), cooldown: int = 10, max_bars: int = 20) -> list[Signal]:
    c = df["close"]
    lower, _, upper = bollinger(c, 20, k)
    r = rsi(c, 7).to_numpy()
    a_s = atr(df, 14)
    a = a_s.to_numpy()
    calm = (a_s < a_s.rolling(1440, min_periods=300).median()).to_numpy()
    hour = df.index.hour.to_numpy()
    cv = c.to_numpy()
    ok = calm & (hour >= hours_utc[0]) & (hour < hours_utc[1]) & (a > 0)
    long_ = ok & (cv < lower.to_numpy()) & (r < rsi_lim)
    short = ok & (cv > upper.to_numpy()) & (r > 100 - rsi_lim)
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
