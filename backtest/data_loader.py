"""Historische XAU/USD-Minutenkerzen von Dukascopy laden (kostenlos, ohne Konto).

Dukascopy liefert pro Tag eine LZMA-komprimierte Datei mit 1-Minuten-Kerzen
(Bid-Seite). Die Dateien werden unter data/raw/ zwischengespeichert, damit
jeder Tag nur einmal geladen wird.

Aufruf:
    python -m backtest.data_loader 2024-10-01 2026-10-01
"""
from __future__ import annotations

import datetime as dt
import lzma
import struct
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
SYMBOL = "XAUUSD"
URL = "https://datafeed.dukascopy.com/datafeed/{sym}/{y:04d}/{m:02d}/{d:02d}/BID_candles_min_1.bi5"
RECORD = struct.Struct(">5If")  # Sekunden seit Tagesbeginn, Open, Close, Low, High, Volumen
# Mögliche Preis-Skalierungen; die plausible wird automatisch gewählt.
DIVISORS = (1000, 100, 100000)


def _url(day: dt.date) -> str:
    # Dukascopy zählt Monate ab 0.
    return URL.format(sym=SYMBOL, y=day.year, m=day.month - 1, d=day.day)


def _download(day: dt.date, retries: int = 4) -> bytes:
    req = urllib.request.Request(_url(day), headers={"User-Agent": "Mozilla/5.0"})
    delay = 2
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return b""
            if attempt == retries - 1:
                raise
        except urllib.error.URLError:
            if attempt == retries - 1:
                raise
        time.sleep(delay)
        delay *= 2
    return b""


def _decode(day: dt.date, blob: bytes) -> pd.DataFrame:
    if not blob:
        return pd.DataFrame()
    raw = lzma.decompress(blob)
    rows = [RECORD.unpack_from(raw, off) for off in range(0, len(raw) - RECORD.size + 1, RECORD.size)]
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows, columns=["sec", "open", "close", "low", "high", "volume"])
    median = df["close"].median()
    divisor = next((d for d in DIVISORS if 300 < median / d < 50000), DIVISORS[0])
    for c in ("open", "close", "low", "high"):
        df[c] = df[c] / divisor
    start = pd.Timestamp(day, tz="UTC")
    df.index = start + pd.to_timedelta(df.pop("sec"), unit="s")
    df.index.name = "time"
    return df[["open", "high", "low", "close", "volume"]]


def load_day(day: dt.date) -> pd.DataFrame:
    """Einen Tag laden (aus dem Cache oder von Dukascopy)."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache = RAW_DIR / f"{SYMBOL}_{day.isoformat()}.bi5"
    if cache.exists():
        blob = cache.read_bytes()
    else:
        blob = _download(day)
        cache.write_bytes(blob)
    return _decode(day, blob)


def load_range(start: dt.date, end: dt.date, verbose: bool = True) -> pd.DataFrame:
    """Alle Minutenkerzen von start (inkl.) bis end (exkl.). Wochenenden werden übersprungen."""
    frames = []
    day = start
    n = 0
    while day < end:
        if day.weekday() != 5:  # Samstag hat keinen Handel
            df = load_day(day)
            if not df.empty:
                frames.append(df)
            n += 1
            if verbose and n % 50 == 0:
                print(f"  {day} geladen", file=sys.stderr)
        day += dt.timedelta(days=1)
    if not frames:
        return pd.DataFrame(columns=["open", "high", "low", "close", "volume"])
    out = pd.concat(frames).sort_index()
    out = out[~out.index.duplicated(keep="last")]
    # Minuten ohne Umsatz liefert Dukascopy als flache Kerzen mit Volumen 0 – die stören Indikatoren nicht,
    # aber Kerzen außerhalb der Handelszeit (Volumen 0 über lange Strecken) werden entfernt.
    return out[out["volume"] > 0]


def save_csv(df: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, compression="gzip")


def read_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, index_col="time", parse_dates=["time"], compression="gzip")
    if df.index.tz is None:
        df.index = df.index.tz_localize("UTC")
    return df


if __name__ == "__main__":
    a = dt.date.fromisoformat(sys.argv[1])
    b = dt.date.fromisoformat(sys.argv[2])
    data = load_range(a, b)
    target = ROOT / "data" / f"{SYMBOL}_M1_{a}_{b}.csv.gz"
    save_csv(data, target)
    print(f"{len(data)} Kerzen gespeichert: {target}")
