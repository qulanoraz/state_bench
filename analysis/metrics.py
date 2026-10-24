"""Per-run metric extraction (dependent variables of the study).

Input : <run_id>_frames.json   (raw FrameTiming list + run metadata)
        <run_id>_summary.json  (Flutter TimelineSummary, used for GC counts)
Output: one dict of run-level metrics.

Definitions (see report, Part 3):
  frame budget   = 1 / display refresh rate (16.67 ms at 60 Hz)
  janky frame    = build time > budget OR raster time > budget
                   (the UI and raster threads are pipelined, so either stage
                   exceeding the budget makes the frame miss its vsync)
  percentiles    = numpy linear interpolation (method="linear")
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

US_PER_S = 1_000_000


def trim_warmup(frames: list[dict], warmup_s: float, measure_s: float) -> list[dict]:
    """Keeps frames whose vsync start lies in [t0 + warmup, t0 + warmup + measure)."""
    if not frames:
        return []
    t0 = min(f["vsync_start_us"] for f in frames)
    lo = t0 + warmup_s * US_PER_S
    hi = lo + measure_s * US_PER_S
    return [f for f in frames if lo <= f["vsync_start_us"] < hi]


def frame_metrics(frames: list[dict], refresh_hz: float = 60.0) -> dict:
    if not frames:
        raise ValueError("no frames in measurement window")
    budget_us = US_PER_S / refresh_hz
    build = np.array([f["build_us"] for f in frames], dtype=float) / 1000
    raster = np.array([f["raster_us"] for f in frames], dtype=float) / 1000
    janky = (build > budget_us / 1000) | (raster > budget_us / 1000)
    return {
        "frames": int(len(frames)),
        "build_mean_ms": float(build.mean()),
        "build_p95_ms": float(np.percentile(build, 95, method="linear")),
        "raster_mean_ms": float(raster.mean()),
        "raster_p95_ms": float(np.percentile(raster, 95, method="linear")),
        "jank_pct": float(100 * janky.mean()),
        "budget_ms": budget_us / 1000,
    }


def load_run(frames_path: Path) -> dict:
    """Builds the full metric row for one run."""
    data = json.loads(Path(frames_path).read_text())
    meta = data["meta"]
    refresh = float(meta.get("refresh_rate_hz") or 60.0)
    window = trim_warmup(data["frames"], meta["warmup_s"], meta["measure_s"])
    row = {
        "run_id": meta["run_id"],
        "lib": meta["lib"],
        "hz": int(meta["hz"]),
        "refresh_rate_hz": refresh,
        "achieved_hz": float(meta["achieved_hz"]),
        "fps": len(window) / meta["measure_s"],
        **frame_metrics(window, refresh),
    }
    rss = meta.get("rss_samples_bytes") or []
    row["peak_rss_mb"] = max(rss) / 2**20 if rss else float("nan")

    summary_path = Path(str(frames_path).replace("_frames.json", "_summary.json"))
    if summary_path.exists():
        s = json.loads(summary_path.read_text())
        traced_s = meta["warmup_s"] + meta["measure_s"] + 2  # +2 s flush tail
        row["gc_new"] = int(s.get("new_gen_gc_count", 0))
        row["gc_old"] = int(s.get("old_gen_gc_count", 0))
        row["gc_per_s"] = (row["gc_new"] + row["gc_old"]) / traced_s
    else:
        row["gc_new"] = row["gc_old"] = -1
        row["gc_per_s"] = float("nan")
    return row
