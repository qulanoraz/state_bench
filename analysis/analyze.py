#!/usr/bin/env python3
"""Turns raw run files into tables, tests and plots.

Usage:
  python analysis/analyze.py results/pilot          # pilot (descriptives only)
  python analysis/analyze.py results/main           # full analysis O2-O4

Expects <dir>/<device_class>/<run_id>_frames.json (+ _summary.json).
Writes <dir>/analysis/{runs.csv, descriptives.csv, o2_tests.csv,
o2_interaction.csv, o3_correlations.csv, o4_device.csv, *.png}.
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from metrics import load_run  # noqa: E402
import stats_tools as st  # noqa: E402

PRIMARY = ["build_p95_ms", "raster_p95_ms", "jank_pct"]
SECONDARY = ["build_mean_ms", "raster_mean_ms"]


def collect(root: Path) -> pd.DataFrame:
    rows = []
    for device_dir in sorted(p for p in root.iterdir() if p.is_dir() and p.name != "analysis"):
        for f in sorted(device_dir.glob("*_frames.json")):
            row = load_run(f)
            row["device"] = device_dir.name
            rows.append(row)
    if not rows:
        sys.exit(f"no *_frames.json files under {root}")
    return pd.DataFrame(rows)


def descriptives(df: pd.DataFrame) -> pd.DataFrame:
    cols = PRIMARY + SECONDARY + ["fps", "achieved_hz", "gc_per_s", "peak_rss_mb"]
    g = df.groupby(["device", "hz", "lib"])[cols]
    out = g.median().add_suffix("_median")
    q = g.quantile(0.75) - g.quantile(0.25)
    out = out.join(q.add_suffix("_iqr")).join(g.size().rename("n"))
    return out.reset_index()


def o2_tests(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    rows, inter = [], []
    for device, d in df.groupby("device"):
        for metric in PRIMARY:
            groups = {}
            for hz, h in d.groupby("hz"):
                x = h.loc[h.lib == "bloc", metric].to_numpy()
                y = h.loc[h.lib == "riverpod", metric].to_numpy()
                if len(x) < 2 or len(y) < 2:
                    continue
                groups[hz] = (x, y)
                a = st.a12(x, y)
                rows.append({"device": device, "metric": metric, "hz": hz,
                             "n_bloc": len(x), "n_riverpod": len(y),
                             "median_bloc": np.median(x), "median_riverpod": np.median(y),
                             "p_raw": st.mann_whitney(x, y), "A12": a,
                             "effect": st.a12_label(a)})
            if len(groups) >= 3:
                slope, p = st.interaction_permutation(groups)
                inter.append({"device": device, "metric": metric,
                              "slope_diff_per_doubling": slope, "p_perm": p})
    tests = pd.DataFrame(rows)
    if not tests.empty:
        tests["p_holm"] = np.nan
        for _, idx in tests.groupby(["device", "metric"]).groups.items():
            tests.loc[idx, "p_holm"] = st.holm(tests.loc[idx, "p_raw"])
    return tests, pd.DataFrame(inter)


def o3_correlations(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for (device, lib), d in df.groupby(["device", "lib"]):
        d = d.dropna(subset=["gc_per_s"])
        if len(d) >= 5:
            rho, p = st.spearman(d.gc_per_s, d.jank_pct)
            rows.append({"device": device, "lib": lib, "n": len(d),
                         "spearman_rho_gc_jank": rho, "p": p})
    return pd.DataFrame(rows)


def o4_device(tests: pd.DataFrame) -> pd.DataFrame:
    if tests.empty or tests.device.nunique() < 2:
        return pd.DataFrame()
    wide = tests.pivot_table(index=["metric", "hz"], columns="device", values="A12")
    wide["A12_gap_low_minus_mid"] = (wide.get("low") - 0.5).abs() - (wide.get("mid") - 0.5).abs()
    return wide.reset_index()


def plot(df: pd.DataFrame, out: Path) -> None:
    for metric, label in [("build_p95_ms", "95th-percentile build time (ms)"),
                          ("raster_p95_ms", "95th-percentile raster time (ms)"),
                          ("jank_pct", "Janky frames (%)")]:
        devices = sorted(df.device.unique())
        fig, axes = plt.subplots(1, len(devices), figsize=(5 * len(devices), 3.6), squeeze=False)
        for ax, device in zip(axes[0], devices):
            d = df[df.device == device]
            for lib, marker in [("bloc", "o"), ("riverpod", "s")]:
                g = d[d.lib == lib].groupby("hz")[metric]
                med, q1, q3 = g.median(), g.quantile(0.25), g.quantile(0.75)
                ax.errorbar(med.index, med, yerr=[med - q1, q3 - med], marker=marker,
                            capsize=3, label=lib)
            if metric != "jank_pct":
                ax.axhline(d.budget_ms.iloc[0], ls="--", lw=0.8, color="grey")
            ax.set_xscale("log", base=2)
            ax.set_xticks(sorted(d.hz.unique()), [str(h) for h in sorted(d.hz.unique())])
            ax.set_xlabel("State updates per second")
            ax.set_ylabel(label)
            ax.set_title(f"{device} device (median, IQR)")
            ax.legend()
        fig.tight_layout()
        fig.savefig(out / f"{metric}.png", dpi=150)
        plt.close(fig)


def main(root: str) -> None:
    root_p = Path(root)
    out = root_p / "analysis"
    out.mkdir(exist_ok=True)
    df = collect(root_p)
    df.to_csv(out / "runs.csv", index=False)
    descriptives(df).to_csv(out / "descriptives.csv", index=False)
    tests, inter = o2_tests(df)
    tests.to_csv(out / "o2_tests.csv", index=False)
    inter.to_csv(out / "o2_interaction.csv", index=False)
    o3_correlations(df).to_csv(out / "o3_correlations.csv", index=False)
    o4_device(tests).to_csv(out / "o4_device.csv", index=False)
    plot(df, out)
    low_rate = df[df.achieved_hz < 0.95 * df.hz]
    print(f"{len(df)} runs loaded; results in {out}")
    if not low_rate.empty:
        print("WARNING: achieved update rate < 95% of nominal in runs:",
              ", ".join(low_rate.run_id))
    off = (df.refresh_rate_hz - 60).abs() > 0.5  # reported rate is a float, e.g. 60.0000024
    if off.any():
        print("WARNING: some runs were not at 60 Hz:", ", ".join(df.loc[off, "run_id"]))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "results/main")
