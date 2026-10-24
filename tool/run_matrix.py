#!/usr/bin/env python3
"""Runs the benchmark matrix on one connected Android device.

Each run is a separate `flutter drive` process (fresh app process and heap).
The order of (library, frequency, repetition) is randomised with a fixed seed
so that thermal drift or battery level cannot line up with one condition.

Examples (from the project root):
  python tool/run_matrix.py --device <adb-id> --device-class low --pilot
  python tool/run_matrix.py --device <adb-id> --device-class mid --reps 30
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import random
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
RESULTS = ROOT / "results"


def sh(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, **kw)


def exe(name: str) -> str:
    path = shutil.which(name)
    if not path:
        sys.exit(f"'{name}' not found on PATH")
    return path


def adb(device: str, *args: str) -> str:
    return sh([exe("adb"), "-s", device, *args]).stdout.strip()


def battery(device: str) -> dict:
    out = adb(device, "shell", "dumpsys", "battery")
    level = re.search(r"level:\s*(\d+)", out)
    temp = re.search(r"temperature:\s*(\d+)", out)
    return {
        "battery_level": int(level.group(1)) if level else None,
        "battery_temp_c": int(temp.group(1)) / 10 if temp else None,
    }


def record_environment(device: str, device_class: str, out_dir: Path) -> None:
    flutter = sh([exe("flutter"), "--version", "--machine"]).stdout
    env = {
        "recorded_at": dt.datetime.now().isoformat(timespec="seconds"),
        # The adb serial number is a device identifier, so it is not stored.
        "device_class": device_class,
        "model": adb(device, "shell", "getprop", "ro.product.model"),
        "android_release": adb(device, "shell", "getprop", "ro.build.version.release"),
        "sdk_int": adb(device, "shell", "getprop", "ro.build.version.sdk"),
        "flutter": json.loads(flutter) if flutter.strip().startswith("{") else flutter,
        "python": sys.version,
    }
    (out_dir / "environment.json").write_text(json.dumps(env, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--device", required=True, help="adb device id (adb devices)")
    ap.add_argument("--device-class", required=True, choices=["low", "mid", "emulator"])
    ap.add_argument("--libs", nargs="+", default=["bloc", "riverpod"])
    ap.add_argument("--hz", nargs="+", type=int, default=[10, 30, 60, 120])
    ap.add_argument("--reps", type=int, default=30)
    ap.add_argument("--cooldown", type=int, default=60, help="seconds between runs")
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--pilot", action="store_true",
                    help="1 rep per condition, 10 s measurement, 15 s cooldown")
    a = ap.parse_args()

    reps, measure_s, cooldown = a.reps, 30, a.cooldown
    if a.pilot:
        reps, measure_s, cooldown = 1, 10, 15

    out_dir = RESULTS / ("pilot" if a.pilot else "main") / a.device_class
    out_dir.mkdir(parents=True, exist_ok=True)
    record_environment(a.device, a.device_class, out_dir)

    plan = [(lib, hz, r) for lib in a.libs for hz in a.hz for r in range(1, reps + 1)]
    random.Random(a.seed).shuffle(plan)
    (out_dir / "run_order.json").write_text(json.dumps(plan))

    log_path = out_dir / "run_log.csv"
    new_log = not log_path.exists()
    with log_path.open("a", newline="") as fh:
        log = csv.writer(fh)
        if new_log:
            log.writerow(["run_id", "lib", "hz", "rep", "started", "seconds",
                          "exit_code", "battery_level", "battery_temp_c", "note"])
        for i, (lib, hz, rep) in enumerate(plan, 1):
            run_id = f"{a.device_class}_{lib}_{hz}_{rep:02d}"
            if (out_dir / f"{run_id}_frames.json").exists():
                print(f"[{i}/{len(plan)}] {run_id}: already done, skipping")
                continue
            bat = battery(a.device)
            print(f"[{i}/{len(plan)}] {run_id} battery={bat}")
            started = dt.datetime.now().isoformat(timespec="seconds")
            t0 = time.time()
            proc = sh([
                exe("flutter"), "drive", "--profile", "--no-dds",
                "-d", a.device,
                "--driver=test_driver/perf_driver.dart",
                "--target=integration_test/benchmark_test.dart",
                f"--dart-define=LIB={lib}", f"--dart-define=HZ={hz}",
                f"--dart-define=MEASURE_S={measure_s}",
                f"--dart-define=RUN_ID={run_id}",
            ])
            secs = round(time.time() - t0, 1)
            note = ""
            frames = BUILD / "run_frames.json"
            summary = BUILD / "run.timeline_summary.json"
            if proc.returncode == 0 and frames.exists() and summary.exists():
                shutil.move(str(frames), out_dir / f"{run_id}_frames.json")
                shutil.move(str(summary), out_dir / f"{run_id}_summary.json")
            else:
                note = "FAILED"
                (out_dir / f"{run_id}_error.log").write_text(proc.stdout + proc.stderr)
            (BUILD / "run.timeline.json").unlink(missing_ok=True)
            log.writerow([run_id, lib, hz, rep, started, secs, proc.returncode,
                          bat["battery_level"], bat["battery_temp_c"], note])
            fh.flush()
            if i < len(plan):
                time.sleep(cooldown)
    print(f"Done. Raw files in {out_dir}")


if __name__ == "__main__":
    main()
