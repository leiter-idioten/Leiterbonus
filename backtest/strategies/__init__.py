"""Alle Strategien. Jede liefert NAME, BESCHREIBUNG, PARAMS (Raster zum Testen) und signals(df, **p)."""
from . import ema_pullback, mean_reversion, orb

ALL = [orb, ema_pullback, mean_reversion]
