"""Statistical procedures used in the analysis plan (report, Part 5).

- Mann-Whitney U (two-sided) on run-level values: frame metrics are skewed
  and bounded (jank % >= 0), so a rank test is used (Arcuri & Briand, 2011).
- Vargha-Delaney A12 effect size: probability that a random BLoC run has a
  larger value than a random Riverpod run (0.5 = no difference).
- Holm correction within each family of tests (Holm, 1979).
- Permutation test for "the difference grows with frequency": the statistic
  is the slope of the BLoC-minus-Riverpod median difference over log2(Hz);
  library labels are shuffled within each frequency level.
"""
from __future__ import annotations

import numpy as np
from scipy import stats


def a12(x, y) -> float:
    x, y = np.asarray(x, float), np.asarray(y, float)
    gt = (x[:, None] > y[None, :]).sum()
    eq = (x[:, None] == y[None, :]).sum()
    return float((gt + 0.5 * eq) / (len(x) * len(y)))


def a12_label(a: float) -> str:
    d = abs(a - 0.5)
    if d < 0.06:
        return "negligible"
    if d < 0.14:
        return "small"
    if d < 0.21:
        return "medium"
    return "large"


def mann_whitney(x, y) -> float:
    return float(stats.mannwhitneyu(x, y, alternative="two-sided").pvalue)


def holm(pvalues) -> np.ndarray:
    p = np.asarray(pvalues, float)
    order = np.argsort(p)
    m = len(p)
    adj = np.empty(m)
    running = 0.0
    for rank, idx in enumerate(order):
        running = max(running, (m - rank) * p[idx])
        adj[idx] = min(1.0, running)
    return adj


def _slope(levels, diffs) -> float:
    return float(np.polyfit(np.log2(levels), diffs, 1)[0])


def interaction_permutation(groups: dict, n_perm: int = 5000, seed: int = 1):
    """groups: {hz: (bloc_values, riverpod_values)} -> (observed_slope, p)."""
    rng = np.random.default_rng(seed)
    levels = sorted(groups)

    def stat(gs):
        diffs = [np.median(gs[h][0]) - np.median(gs[h][1]) for h in levels]
        return _slope(levels, diffs)

    obs = stat(groups)
    count = 0
    for _ in range(n_perm):
        perm = {}
        for h in levels:
            x, y = map(np.asarray, groups[h])
            pooled = rng.permutation(np.concatenate([x, y]))
            perm[h] = (pooled[: len(x)], pooled[len(x):])
        if abs(stat(perm)) >= abs(obs):
            count += 1
    return obs, (count + 1) / (n_perm + 1)


def spearman(x, y):
    r = stats.spearmanr(x, y)
    return float(r.statistic), float(r.pvalue)
