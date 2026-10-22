"""Technische Indikatoren auf Minutenkerzen (pandas, ohne Blick in die Zukunft)."""
from __future__ import annotations

import pandas as pd


def ema(s: pd.Series, n: int) -> pd.Series:
    return s.ewm(span=n, adjust=False, min_periods=n).mean()


def atr(df: pd.DataFrame, n: int = 14) -> pd.Series:
    prev = df["close"].shift(1)
    tr = pd.concat([df["high"] - df["low"], (df["high"] - prev).abs(), (df["low"] - prev).abs()], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / n, adjust=False, min_periods=n).mean()


def rsi(s: pd.Series, n: int = 14) -> pd.Series:
    d = s.diff()
    up = d.clip(lower=0).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    down = (-d.clip(upper=0)).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    rs = up / down
    return 100 - 100 / (1 + rs)


def bollinger(s: pd.Series, n: int = 20, k: float = 2.0) -> tuple[pd.Series, pd.Series, pd.Series]:
    mid = s.rolling(n, min_periods=n).mean()
    sd = s.rolling(n, min_periods=n).std(ddof=0)
    return mid - k * sd, mid, mid + k * sd


def session_vwap(df: pd.DataFrame, tz: str = "America/New_York") -> pd.Series:
    """VWAP, jeden Handelstag (Ortszeit tz) neu gestartet."""
    typ = (df["high"] + df["low"] + df["close"]) / 3
    day = df.index.tz_convert(tz).date
    pv = (typ * df["volume"]).groupby(day).cumsum()
    v = df["volume"].groupby(day).cumsum()
    return pv / v


def higher_tf_ema(df: pd.DataFrame, rule: str, n: int) -> pd.Series:
    """EMA auf einem höheren Zeitrahmen, nur aus abgeschlossenen Kerzen, zurück auf M1 gelegt."""
    closes = df["close"].resample(rule, label="right", closed="left").last().dropna()
    e = ema(closes, n)
    # label="right": Wert gilt erst ab dem Ende der höheren Kerze -> kein Blick in die Zukunft.
    return e.reindex(df.index, method="ffill")
