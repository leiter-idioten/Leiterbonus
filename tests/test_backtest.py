"""Tests für die Backtest-Logik mit künstlichen Kerzen (keine Marktdaten).

    python -m unittest discover -s tests
"""
from __future__ import annotations

import unittest

import numpy as np
import pandas as pd

from backtest import engine, report
from backtest.engine import Signal
from backtest.indicators import higher_tf_ema
from backtest.strategies import ALL


def candles(rows, start="2026-03-02 14:30", freq="1min"):
    idx = pd.date_range(start, periods=len(rows), freq=freq, tz="UTC")
    return pd.DataFrame(rows, columns=["open", "high", "low", "close"], index=idx).assign(volume=1.0)


class EngineTest(unittest.TestCase):
    def test_long_take_profit_pays_spread(self):
        df = candles([(100, 100, 100, 100), (100, 100.5, 99.9, 100.4), (100.4, 103.5, 100.3, 103)])
        t = engine.run(df, [Signal(0, 1, 2.0, 3.0)], spread=0.3, slippage=0)[0]
        self.assertAlmostEqual(t.entry, 100.3)
        self.assertEqual(t.reason, "tp")
        self.assertAlmostEqual(t.pnl_usd, 3.0)
        self.assertAlmostEqual(t.r, 1.5)

    def test_same_bar_counts_as_stop(self):
        df = candles([(100, 100, 100, 100), (100, 110, 90, 100)])
        t = engine.run(df, [Signal(0, 1, 2.0, 3.0)], spread=0, slippage=0.05)[0]
        self.assertEqual(t.reason, "sl")
        self.assertAlmostEqual(t.pnl_usd, -2.05)

    def test_short_stop_uses_ask(self):
        # Bid-Hoch 101.8 + Spread 0.3 = Ask 102.1 >= Stop 102 -> Stop
        df = candles([(100, 100, 100, 100), (100, 101.8, 99.9, 101)])
        t = engine.run(df, [Signal(0, -1, 2.0, 3.0)], spread=0.3, slippage=0)[0]
        self.assertEqual(t.reason, "sl")
        self.assertAlmostEqual(t.pnl_usd, -2.0)

    def test_gap_through_stop_fills_at_open(self):
        df = candles([(100, 100, 100, 100), (100, 100.2, 99.8, 100), (95, 96, 94, 95)])
        t = engine.run(df, [Signal(0, 1, 2.0, 3.0)], spread=0, slippage=0)[0]
        self.assertAlmostEqual(t.exit, 95)

    def test_time_exit_and_one_trade_at_a_time(self):
        df = candles([(100, 100.1, 99.9, 100)] * 10)
        tr = engine.run(df, [Signal(0, 1, 2.0, 3.0, max_bars=5), Signal(2, 1, 2.0, 3.0)], spread=0, slippage=0)
        self.assertEqual(len(tr), 1)
        self.assertEqual(tr[0].reason, "zeit")
        self.assertEqual(tr[0].bars, 5)

    def test_metrics(self):
        df = candles([(100, 100, 100, 100), (100, 104, 99.5, 103), (103, 103, 103, 103), (103, 103.1, 100, 101)])
        tr = engine.to_frame(engine.run(df, [Signal(0, 1, 2.0, 3.0), Signal(2, 1, 2.0, 3.0)], spread=0, slippage=0))
        m = engine.metrics(tr)
        self.assertEqual(m["trades"], 2)
        self.assertEqual(m["trefferquote"], 50.0)
        self.assertEqual(m["profit_faktor"], 1.5)


class NoLookaheadTest(unittest.TestCase):
    def test_higher_tf_ema_only_uses_closed_bars(self):
        n = 3000
        df = candles([(1, 1, 1, 1)] * n)
        base = higher_tf_ema(df, "5min", 3)
        df2 = df.copy()
        df2.iloc[-1, df2.columns.get_loc("close")] = 1000  # letzte Kerze ändern
        changed = higher_tf_ema(df2, "5min", 3)
        # Eine Änderung in der letzten Minute darf keine früheren Werte beeinflussen.
        pd.testing.assert_series_equal(base.iloc[:-1], changed.iloc[:-1])


class PipelineTest(unittest.TestCase):
    def test_strategies_and_report_run_on_random_walk(self):
        rng = np.random.default_rng(1)
        idx = pd.date_range("2026-01-05", "2026-02-20", freq="1min", tz="UTC")
        idx = idx[idx.dayofweek < 5]
        close = 2000 + np.cumsum(rng.normal(0, 0.4, len(idx)))
        opn = np.r_[close[0], close[:-1]]
        noise = np.abs(rng.normal(0, 0.2, len(idx)))
        df = pd.DataFrame({"open": opn, "high": np.maximum(opn, close) + noise, "low": np.minimum(opn, close) - noise,
                           "close": close, "volume": 1.0}, index=idx)
        for s in ALL:
            sigs = s.signals(df, **s.PARAMS[0])
            self.assertTrue(all(x.sl_dist > 0 for x in sigs), s.NAME)
        res = report.run_all(df, spread=0.3, slippage=0.05)
        self.assertEqual(len(res["strategien"]), len(ALL))
        # Zufallskurs: nach Kosten darf nichts "aktiv" werden.
        self.assertFalse(any(s["aktiv"] for s in res["strategien"]))


if __name__ == "__main__":
    unittest.main()
