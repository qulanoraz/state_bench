# state_bench — BLoC vs Riverpod under high-frequency state updates

Testbed for Assignment 3 (Ashkenov N., Orazbek U., SE-2406).
One Flutter app, one UI (48-tile live dashboard), one seeded update generator;
only the state layer differs (`lib/variants/`).

```
lib/bench/config.dart          run parameters (--dart-define LIB, HZ, MEASURE_S ...)
lib/bench/telemetry.dart       shared state object, TelemetrySink interface, UpdateGenerator
lib/bench/frame_recorder.dart  raw FrameTiming + RSS recorder
lib/ui/dashboard.dart          shared UI (Dashboard, TileView)
lib/variants/bloc_variant.dart     BLoC: Bloc + BlocSelector per tile
lib/variants/riverpod_variant.dart Riverpod: Notifier + select() per tile
test/equivalence_test.dart     O1 functional-equivalence tests (flutter test)
integration_test/benchmark_test.dart  one benchmark run on a device
test_driver/perf_driver.dart   writes build/run_frames.json + build/run.timeline_summary.json
tool/run_matrix.py             randomised run matrix with cooldown and logging
analysis/                      metrics, statistics, plots, unit tests
```

## 1. One-time setup (Windows, VS Code)

```powershell
cd state_bench
flutter create . --platforms=android --project-name state_bench   # adds android/
del test\widget_test.dart          # template test, not part of the study
flutter pub get
flutter test                       # O1 equivalence tests must pass
python -m pip install numpy scipy pandas matplotlib
cd analysis; python -m unittest -v test_pipeline; cd ..
```

## 2. Prepare the phone (every session)

Developer options → USB debugging ON; display refresh rate locked to 60 Hz
(Settings → Display → Motion smoothness / Refresh rate → Standard 60 Hz);
airplane mode ON; brightness fixed at 50 %; battery ≥ 50 % and not charging
at full speed; close all other apps; phone lying on the table, not in a case.
Check that all 48 tiles are visible on screen without scrolling.

## 3. Pilot (≈ 25–40 min per phone)

```powershell
adb devices                                     # copy the id
python tool/run_matrix.py --device <id> --device-class low --pilot
python analysis/analyze.py results/pilot
```

## 4. Main experiment (30 runs × 8 conditions per phone, resumable)

```powershell
python tool/run_matrix.py --device <id> --device-class low --reps 30
python tool/run_matrix.py --device <id2> --device-class mid --reps 30
python analysis/analyze.py results/main
```

Commit `pubspec.lock`, `results/**/environment.json`, `run_order.json`,
`run_log.csv` and raw `*_frames.json` / `*_summary.json` files.
