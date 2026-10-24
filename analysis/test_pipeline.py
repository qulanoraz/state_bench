"""Verification tests for the analysis pipeline (python -m unittest -v).

All inputs here are small HAND-MADE FIXTURES with known correct answers.
They check that the code computes the metrics correctly; they are NOT
experimental results and must never be reported as such.
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import metrics  # noqa: E402
import stats_tools as st  # noqa: E402
import analyze  # noqa: E402


def frame(t_ms, build_ms, raster_ms):
    return {"vsync_start_us": int(t_ms * 1000), "build_us": int(build_ms * 1000),
            "raster_us": int(raster_ms * 1000), "total_us": 0, "vsync_overhead_us": 0}


class FrameMetricTests(unittest.TestCase):
    def test_jank_uses_build_or_raster(self):
        fr = [frame(0, 5, 5), frame(16, 20, 5), frame(33, 5, 20), frame(50, 5, 5)]
        m = metrics.frame_metrics(fr, refresh_hz=60)
        self.assertEqual(m["frames"], 4)
        self.assertAlmostEqual(m["jank_pct"], 50.0)  # frames 2 and 3

    def test_exactly_on_budget_is_not_jank(self):
        fr = [frame(0, 1000 / 60, 1)]
        self.assertEqual(metrics.frame_metrics(fr, 60)["jank_pct"], 0.0)

    def test_p95_linear_interpolation(self):
        fr = [frame(i, b, 1) for i, b in enumerate(range(1, 21))]  # 1..20 ms
        m = metrics.frame_metrics(fr)
        self.assertAlmostEqual(m["build_p95_ms"], 19.05, places=6)
        self.assertAlmostEqual(m["build_mean_ms"], 10.5)

    def test_budget_follows_refresh_rate(self):
        fr = [frame(0, 10, 1)]  # 10 ms: fine at 60 Hz, janky at 120 Hz
        self.assertEqual(metrics.frame_metrics(fr, 60)["jank_pct"], 0.0)
        self.assertEqual(metrics.frame_metrics(fr, 120)["jank_pct"], 100.0)

    def test_warmup_trimming(self):
        fr = [frame(t, 1, 1) for t in range(0, 10_000, 100)]  # 0..9.9 s
        kept = metrics.trim_warmup(fr, warmup_s=2, measure_s=5)
        self.assertEqual(kept[0]["vsync_start_us"], 2_000_000)
        self.assertEqual(kept[-1]["vsync_start_us"], 6_900_000)
        self.assertEqual(len(kept), 50)


class StatsTests(unittest.TestCase):
    def test_a12_extremes(self):
        self.assertEqual(st.a12([5, 6, 7], [1, 2, 3]), 1.0)
        self.assertEqual(st.a12([1, 2, 3], [5, 6, 7]), 0.0)
        self.assertEqual(st.a12([1, 2], [1, 2]), 0.5)

    def test_holm_matches_hand_computation(self):
        adj = st.holm([0.01, 0.04, 0.03, 0.005])
        np.testing.assert_allclose(adj, [0.03, 0.06, 0.06, 0.02])

    def test_permutation_detects_growing_difference(self):
        rng = np.random.default_rng(0)
        g = {hz: (rng.normal(10 + k * 3, 1, 15), rng.normal(10, 1, 15))
             for k, hz in enumerate([10, 30, 60, 120])}
        slope, p = st.interaction_permutation(g, n_perm=999)
        self.assertGreater(slope, 0)
        self.assertLess(p, 0.01)

    def test_permutation_no_difference(self):
        rng = np.random.default_rng(1)
        g = {hz: (rng.normal(10, 1, 15), rng.normal(10, 1, 15))
             for hz in [10, 30, 60, 120]}
        _, p = st.interaction_permutation(g, n_perm=999)
        self.assertGreater(p, 0.05)


class EndToEndTest(unittest.TestCase):
    """Writes two fake run files in the real file format and runs analyze.py."""

    def test_pipeline_runs_on_file_format(self):
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp) / "low"
            d.mkdir()
            for lib, build in [("bloc", 8.0), ("riverpod", 9.0)]:
                run_id = f"low_{lib}_60_01"
                frames = [frame(t * 16.67, build, 4.0) for t in range(0, 600)]
                meta = {"lib": lib, "hz": 60, "tiles": 48, "seed": 42, "warmup_s": 1,
                        "measure_s": 5, "run_id": run_id, "refresh_rate_hz": 60.0,
                        "samples_emitted": 360, "achieved_hz": 59.8,
                        "rss_before_bytes": 1, "rss_samples_bytes": [100 * 2**20],
                        "max_rss_bytes": 1}
                (d / f"{run_id}_frames.json").write_text(json.dumps({"frames": frames, "meta": meta}))
                (d / f"{run_id}_summary.json").write_text(json.dumps({"new_gen_gc_count": 16, "old_gen_gc_count": 0}))
            analyze.main(tmp)
            runs = (Path(tmp) / "analysis" / "runs.csv").read_text().splitlines()
            self.assertEqual(len(runs), 3)  # header + 2 runs
            row = metrics.load_run(d / "low_bloc_60_01_frames.json")
            self.assertEqual(row["frames"], 300)  # 5 s at 60 fps
            self.assertAlmostEqual(row["gc_per_s"], 16 / 8)
            self.assertAlmostEqual(row["peak_rss_mb"], 100.0)
            self.assertTrue((Path(tmp) / "analysis" / "jank_pct.png").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
