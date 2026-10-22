"""Opening-Range-Breakout zur New-York-Eröffnung.

Die Spanne (Hoch/Tief) der ersten Minuten ab 9:30 New York (15:30 deutsche Zeit) wird gemessen.
Schließt danach eine 1-Minuten-Kerze darüber -> Long, darunter -> Short. Höchstens ein Trade pro Tag.
Stop = Anteil der Spannenbreite (mindestens/höchstens begrenzt), Take-Profit = Stop x CRV.
"""
from __future__ import annotations

import pandas as pd

from ..engine import Signal
from ..indicators import atr

NAME = "Opening-Range-Breakout"
BESCHREIBUNG = "Ausbruch aus der Spanne der ersten Minuten nach der New-York-Eröffnung (15:30 deutsche Zeit)."
PARAMS = [
    {"range_min": r, "sl_frac": f, "crv": c}
    for r in (5, 15)
    for f in (0.5, 1.0)
    for c in (1.5, 2.0)
]


def signals(df: pd.DataFrame, range_min: int = 15, sl_frac: float = 0.5, crv: float = 1.5,
            window_min: int = 90, sl_min_atr: float = 1.0, sl_max_atr: float = 4.0, max_bars: int = 30) -> list[Signal]:
    ny = df.index.tz_convert("America/New_York")
    minutes = ny.hour * 60 + ny.minute
    a = atr(df, 14).to_numpy()
    close, high, low = df["close"].to_numpy(), df["high"].to_numpy(), df["low"].to_numpy()
    start = 9 * 60 + 30
    out: list[Signal] = []
    days = pd.Series(range(len(df)), index=df.index).groupby(ny.date)
    for _, pos in days:
        p = pos.to_numpy()
        m = minutes[p]
        rng = p[(m >= start) & (m < start + range_min)]
        if len(rng) < max(3, range_min // 2):
            continue
        hi, lo_ = high[rng].max(), low[rng].min()
        width = hi - lo_
        after = p[(m >= start + range_min) & (m < start + range_min + window_min)]
        for i in after:
            d = 1 if close[i] > hi else -1 if close[i] < lo_ else 0
            if d == 0 or not a[i] > 0:
                continue
            sl = min(max(width * sl_frac, sl_min_atr * a[i]), sl_max_atr * a[i])
            out.append(Signal(int(i), d, float(sl), float(sl * crv), max_bars))
            break
    return out
