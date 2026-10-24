const fs = require('fs');
const path = require('path');

module.exports = ({ P, H1, H2, B, N, Caption, code, table, gap, image, ROOT, PageBreak, Paragraph, TextRun, runs, AlignmentType }) => {
  const src = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').trimEnd();
  const excerpt = (rel, from, to) => {
    const lines = src(rel).split('\n');
    const a = lines.findIndex((l) => l.includes(from));
    const b = to ? lines.findIndex((l, i) => i > a && l.includes(to)) : lines.length - 1;
    const sel = lines.slice(a, b + 1);
    const ind = Math.min(...sel.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return sel.map((l) => l.slice(ind)).join('\n');
  };
  const testLog = src('evidence/pipeline_tests.txt').replace(/ \d+ runs loaded; results in \S+\n/g, ' ').replace(/ \(test_pipeline\.[^)]+\)/g, '');

  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Assignment #3. Methodology and Core Practical Implementation', bold: true, size: 30 })] }),
    P('**Student(s):** Ashkenov Nurgaly, Orazbek Ulan', { align: AlignmentType.LEFT }),
    P('**Group:** SE-2406', { align: AlignmentType.LEFT }),
    P('**Core practical track:** Other Technical Experiment (controlled performance benchmark / testbed)', { align: AlignmentType.LEFT }),
    P('**Repository:** [[FILL: GitHub link to the state_bench repository]]', { align: AlignmentType.LEFT }),

    // ------------------------------------------------------------------ 1
    H1('1. Final / Revised Research Title'),
    P('Frame Rendering Performance of BLoC and Riverpod in Flutter Under High-Frequency State Updates: A Controlled Comparison on Low-End and Mid-Range Android Devices'),
    P('The title is the same as in Assignment 2. No change of topic or research question was made.'),

    // ------------------------------------------------------------------ 2
    H1('2. Primary Research Question, Aim and Objectives'),
    P('**Primary research question (RQ).** How do the BLoC and Riverpod state management architectures compare in frame build time, raster time and jank percentage in a Flutter application on Android as the state update frequency increases from 10 to 120 updates per second?'),
    P('**SQ1.** To what extent are differences in jank percentage associated with differences in memory allocation rate and garbage-collection frequency?'),
    P('**SQ2.** Does the difference between the two architectures change between a low-end and a mid-range Android device?'),
    P('**Aim.** To determine how the choice between the BLoC and Riverpod state management architectures affects the frame rendering performance of a Flutter application as the state update frequency increases, and to explain any difference through memory allocation and garbage-collection behaviour.'),
    P('**Objectives.**'),
    B('**O1.** To develop a controlled Flutter testbed in which an identical user interface and synthetic update generator are implemented once with BLoC and once with Riverpod, so that the state management layer is the only difference between the two versions.'),
    B('**O2.** To compare frame build time, raster time (mean and 95th percentile) and jank percentage of the two architectures at 10, 30, 60 and 120 updates per second. (→ RQ, H1)'),
    B('**O3.** To examine the memory allocation rate and GC frequency of each architecture and assess their association with jank percentage. (→ SQ1, H2)'),
    B('**O4.** To determine whether the differences between the two architectures change between a low-end and a mid-range Android device. (→ SQ2, H3)'),
    P('*Note on O3.* The objective is unchanged, but while building the testbed we found that measuring allocations inside the timed runs disturbs the frame timings (Section 9.6). Allocation rate is therefore collected in separate diagnostic runs, while GC frequency is collected in every timed run.'),

    // ------------------------------------------------------------------ 3
    H1('3. Research Approach and Design'),
    P('The study is **quantitative and experimental**. The specific design is a **controlled laboratory experiment with a full factorial design**: 2 architectures (BLoC, Riverpod) × 4 update frequencies (10, 30, 60, 120 updates/s) × 2 device classes (low-end, mid-range), 16 conditions in total. The RQ asks how a measurable outcome changes when two factors vary, so we need to set those factors ourselves and keep everything else constant. The UI, the update generator and its seed, the Flutter SDK and the build mode are the same in every condition; only the state layer is swapped. A difference in the outcome can then be attributed to the manipulated factor (Wohlin et al., 2012).'),
    P('**Unit of analysis:** one benchmark run, i.e. one app launch in one condition with a 30-second measurement window. Frames are recorded but aggregated into run-level values, because frames inside one run are not independent and treating thousands of them as observations would make almost any difference "significant" (Kalibera & Jones, 2013).'),
    P('**Evidence produced:** distributions of run-level frame and memory metrics per condition, effect sizes and significance tests.'),
    P('**Rejected alternative:** a comparative case study of existing open-source BLoC and Riverpod apps. It is more realistic, but such apps differ in screens, features and code quality, so a difference could not be traced to the library, and none of them lets us set the update rate.'),

    // ------------------------------------------------------------------ 4
    H1('4. Sample / Dataset / Cases / Research Context'),
    P('**Research material:** (1) the testbed app *state_bench*, a 48-tile live dashboard similar to telemetry or trading screens, in two variants; (2) two physical Android phones; (3) the benchmark runs. The target population is Flutter apps on Android that update the UI continuously and run on low-end and mid-range phones.'),
    P('**Inclusion and exclusion criteria.**'),
    table(['', 'Inclusion', 'Exclusion'], [
      ['Devices', 'Android 10 or newer; refresh rate can be locked to 60 Hz; USB debugging available. Low-end: ≤ 4 GB RAM, entry-level SoC. Mid-range: 6–8 GB RAM, mid-tier SoC.', 'Emulators (host CPU and emulated GPU make frame times unrealistic); rooted phones or custom ROMs; vendor "game/performance" modes that cannot be turned off.'],
      ['Runs', 'Run finished without error; achieved update rate ≥ 95 % of the nominal rate; display at 60 Hz during the run.', 'Failed or interrupted runs; battery below 50 %. Excluded runs are logged in run_log.csv and repeated, not silently removed.'],
    ], [1200, 4100, 4000]),
    gap(),
    P('**Sample size:** **30 runs per condition**, 240 per device, 480 in total. Thirty repetitions is the common minimum for noisy software experiments (Arcuri & Briand, 2011; Georges et al., 2007); earlier Flutter studies used two (Zulistiyan et al., 2024) or twenty runs (Puryanto & Akbar, 2025). A run takes about 2–2.5 minutes with build and cooldown, so one phone needs 9–10 hours spread over several evenings (the runner resumes where it stopped). Our lower limit is 20 runs if the pilot shows low variance.'),
    P('**Selection and access:** **purposive sampling**, one phone per class, because we compare hardware classes rather than estimate all Android phones. Both phones belong to the team: low-end – [[FILL: model, RAM, SoC, Android]]; mid-range – [[FILL: model, RAM, SoC, Android]].'),
    P('**Bias:** (1) with one phone per class, vendor and SoC effects mix with the class effect, so we report exact models and treat SQ2 as exploratory; (2) a phone heats up during a session, so run order is randomised, runs are separated by a cooldown and battery temperature is logged; (3) we wrote both variants, so both follow the official documentation patterns (Bloc Library, n.d.; Riverpod, n.d.) and equivalence tests check that they behave the same.'),

    // ------------------------------------------------------------------ 5
    H1('5. Variables / Constructs / Measures / Instruments / Metrics'),
    P('**Independent variables:** architecture (BLoC / Riverpod); update frequency (10, 30, 60, 120 updates/s – well below, half of, equal to and double the 60 Hz refresh rate); device class (low-end / mid-range).'),
    P('**Dependent variables (O2):** **build time** (UI thread) and **raster time** (raster thread), each as mean and 95th percentile per run; **jank %**, the share of frames where build *or* raster time exceeds the 16.67 ms budget at 60 Hz. The threads form a pipeline, so either stage being slow makes the frame miss its vsync, which is also how DevTools marks slow frames (Flutter, n.d.-a). Callan and Petke (2021) used similar measures.'),
    P('**Secondary variables (O3):** GC events per second, peak resident memory (RSS) and, in diagnostic runs, allocation rate.'),
    P('**Controls:** SDK and pinned library versions (flutter_bloc 9.1.1, flutter_riverpod 2.6.1), profile build, identical UI, one selector per tile in both variants, seed 42, 60 Hz display, airplane mode, fixed brightness, battery ≥ 50 %, cooldown, randomised order. **Manipulation checks:** achieved update rate and refresh rate in every run.'),
    table(['Measure', 'Instrument / source', 'Evidence for'], [
      ['Build and raster time per frame', '`FrameTiming` objects reported by the Flutter engine via `SchedulerBinding.addTimingsCallback` (Flutter, n.d.-c)', 'O2, O4'],
      ['Jank %', 'Computed from the same FrameTiming data against the budget 1/refresh rate', 'O2, O3, O4'],
      ['GC count', '`new_gen_gc_count`, `old_gen_gc_count` from Flutter `TimelineSummary` recorded with `traceAction` (Flutter, n.d.-b)', 'O3'],
      ['Peak RSS', '`ProcessInfo.currentRss` (dart:io), sampled once per second', 'O3'],
      ['Allocation rate', 'Flutter DevTools Memory view, separate diagnostic runs', 'O3'],
      ['Achieved update rate, refresh rate', 'Generator counter / stopwatch; `FlutterView.display.refreshRate`', 'O1 (validity check)'],
      ['Battery level and temperature', '`adb shell dumpsys battery` before every run', 'Control'],
    ], [2200, 5100, 2000]),
    gap(),
    P('Raw per-frame data are recorded because the TimelineSummary gives only the 90th and 99th percentiles.'),

    // ------------------------------------------------------------------ 6
    H1('6. Data Collection / Preparation / Experimental Procedure'),
    P('The procedure, in chronological order:'),
    N('**Environment.** Flutter stable on Windows 11 / VS Code; the runner saves the exact version (`flutter --version --machine`) to environment.json; libraries are pinned in pubspec.yaml and pubspec.lock.'),
    N('**Testbed check (O1).** `flutter test` runs the equivalence tests: both variants must render the same 48 tiles and values after the same update.'),
    N('**Device preparation** each session (Appendix E): 60 Hz, airplane mode, fixed brightness, other apps closed, battery ≥ 50 %.'),
    N('**Pilot.** One run per condition with a 10-second window (`run_matrix.py --pilot`) to test the chain and see the variance.'),
    N('**Main runs.** The runner shuffles the 240 (architecture, frequency, repetition) combinations of a device with seed 2026 and calls `flutter drive --profile --no-dds` for each, passing the condition as `--dart-define`. In a run the app starts, the test binding switches to the `benchmarkLive` frame policy so frames follow the device vsync, the generator runs for 5 s warm-up plus a 30 s window, and after a 2 s flush the data go to the host. Two JSON files are saved; exit code, battery level and temperature are logged; then a 60 s cooldown.'),
    N('**Diagnostic runs (O3).** Three extra runs per condition with the DevTools Memory view for allocation rate; not used for timings.'),
    N('**Data preparation.** Raw files are never edited. The analysis script removes warm-up frames by their vsync timestamps, computes run-level metrics and writes runs.csv. Failed runs keep an error log and are repeated.', 'steps'),
    P('**Fairness.** Both variants get the same value sequence, render the same widget tree and use one selector per tile. Both live in the same binary, and every run is a fresh process, so heap state does not carry over. All raw data, logs and scripts are kept in the Git repository.'),

    // ------------------------------------------------------------------ 7
    H1('7. Data Analysis Plan'),
    P('The analysis uses run-level values (runs.csv). Frame metrics are skewed and jank % is bounded at zero, so we use non-parametric statistics (Arcuri & Briand, 2011); α = 0.05.'),
    P('**Descriptives:** median and IQR per condition, plus mean and SD for comparison with earlier studies; plots of each metric against frequency.'),
    P('**O1:** equivalence tests pass, the code diff is limited to lib/variants/, and runs with achieved rate < 95 % of nominal or refresh ≠ 60 Hz are flagged and reported.'),
    P('**O2 (H1):** for each device, frequency and metric (build p95, raster p95, jank %), a two-sided Mann–Whitney U test compares BLoC with Riverpod. Effect size is Vargha–Delaney A12, the probability that a random BLoC run scores higher than a random Riverpod run (0.56/0.64/0.71 = small/medium/large; Vargha & Delaney, 2000). The four tests per metric are Holm-corrected (Holm, 1979). Whether the difference *grows* with frequency is tested by permutation: the statistic is the slope of the median difference over log2(frequency), compared with 5,000 shuffles of library labels within each frequency. H1 is supported if differences are significant at higher frequencies and the slope has p < 0.05.'),
    P('**O3 (H2):** Spearman ρ between GC events per second and jank % per architecture and device, and Mann–Whitney tests on GC/s; allocation rate is reported descriptively. This shows association, not causation.'),
    P('**O4 (H3):** O2 is repeated per device and |A12 − 0.5| is compared between devices; H3 is supported if the effect is consistently larger on the low-end phone (exploratory).'),
    P('**Error analysis:** for the worst run per condition we inspect the timeline in DevTools to see whether slow frames are build- or raster-bound and coincide with GC.'),

    // ------------------------------------------------------------------ 8
    H1('8. Research Quality, Ethics, Privacy and Reproducibility'),
    P('**Internal validity:** one factor changes between paired conditions, confirmed by equivalence tests and manipulation checks; randomised order and cooldowns protect against heat and battery drift. Small environment details can change results (Mytkowicz et al., 2009), so the environment is fixed and recorded each session.'),
    P('**Measurement validity and reliability:** timings come from the engine in profile mode, since debug builds are much slower (Flutter, n.d.-a); 30 runs per condition and reporting dispersion make results stable; allocation tracing is off in timed runs so the measurement does not distort what it measures.'),
    P('**External validity:** synthetic workload, Android only, two phones; we do not generalise beyond similar dashboards and devices.'),
    P('**Reproducibility:** pinned versions, pubspec.lock, fixed seeds, raw data, run log and scripts are in the repository; re-running `analyze.py` on our raw data gives the same tables.'),
    P('**Ethics and privacy:** no human participants and no personal data; the app generates synthetic values and records only timings and memory. On our personal phones it reads nothing else, airplane mode is on, and the runner does not store the adb serial number. Data stay in the team repository until the end of the diploma project.'),
    P('**AI tools:** used, as course rules allow, for language checking and code review; only our own code and synthetic data were shared. We checked every decision and can explain it at the defence.'),

    // ------------------------------------------------------------------ 9
    H1('9. Core Practical Component / Initial Implementation'),
    P('**Track:** Other Technical Experiment. The required artifact is the testbed and the measurement pipeline: environment and configuration, a comparison condition, test scenarios, measurable outcomes, first outputs and reproducible scripts. The component directly supports **O1** and builds the measurement chain for **O2–O4**.'),
    H2('9.1 What was implemented'),
    table(['Component', 'File(s)', 'Purpose', 'Status'], [
      ['Run configuration', 'lib/bench/config.dart', 'LIB, HZ, seed, warm-up and window passed by --dart-define', 'Done'],
      ['Shared state + generator', 'lib/bench/telemetry.dart', 'Immutable DashboardState; TelemetrySink interface; seeded UpdateGenerator', 'Done'],
      ['Shared UI', 'lib/ui/dashboard.dart', '48-tile grid; TileView (value + bar)', 'Done'],
      ['BLoC variant', 'lib/variants/bloc_variant.dart', 'Bloc with SampleArrived event; BlocSelector per tile', 'Done'],
      ['Riverpod variant', 'lib/variants/riverpod_variant.dart', 'Notifier + NotifierProvider; Consumer with select() per tile', 'Done'],
      ['Frame recorder', 'lib/bench/frame_recorder.dart', 'Raw FrameTiming + 1 Hz RSS', 'Done'],
      ['Equivalence tests (O1)', 'test/equivalence_test.dart', 'Same tiles, same values, same seed sequence', 'Written; [[FILL: result of flutter test]]'],
      ['Benchmark run + driver', 'integration_test/, test_driver/', 'One timed run; writes frames + timeline summary', 'Written; [[FILL: pilot]]'],
      ['Run matrix', 'tool/run_matrix.py', 'Randomised order, cooldown, battery log, resume', 'Done'],
      ['Analysis pipeline', 'analysis/*.py', 'Metrics, Mann–Whitney, A12, Holm, permutation, Spearman, plots', 'Done; 10/10 tests pass'],
    ], [1900, 2300, 3600, 1500], { size: 18 }),
    gap(),
    H2('9.2 Architecture and data flow'),
    image(path.join(ROOT, 'docs', 'arch.png'), 400, Math.round(400 * 2882 / 1902)),
    Caption('Figure 1. Testbed architecture. The generator only knows the TelemetrySink interface; LIB decides which implementation is created. Everything outside the two variant boxes is shared code.'),
    H2('9.3 Key implementation decisions'),
    B('**One interface between generator and state layer.** `UpdateGenerator` calls only `TelemetrySink.push()`. The BLoC sink turns the sample into an event (`bloc.add`), the Riverpod sink calls the notifier method. The cost of generating values is therefore identical, and the measured difference is the cost of propagating the state.'),
    B('**Same rebuild scope.** Prayoga et al. (2021) showed that where state is scoped matters as much as the library. Each tile therefore subscribes to its own value in both variants (`BlocSelector` vs `ref.watch(provider.select(...))`). The natural difference stays: BLoC creates an event object and delivers it asynchronously through a stream, while Riverpod updates the state synchronously. That is part of the architecture we want to measure.'),
    B('**Frame policy.** By default, Flutter integration tests show only frames requested by the test (`fadePointers` policy). We switch to `benchmarkLive` after start-up so that the app and the engine schedule frames as on a normal device.'),
    B('**Raw frames and timestamp-based warm-up.** FrameTiming reports arrive in batches, so a batch that reaches us after the warm-up can still contain warm-up frames. We therefore record everything from the start and cut the first 5 seconds in the analysis using each frame’s vsync timestamp.'),
    H2('9.4 Verification of the analysis pipeline'),
    P('Before using the pipeline on real data we tested it on small hand-made inputs whose correct answers we know (e.g. 20 frames of 1–20 ms must give p95 = 19.05 ms; Holm-adjusted values were compared with a manual calculation; a frame exactly on budget must not count as jank; a 10 ms frame is fine at 60 Hz but janky at 120 Hz). These fixtures only check the code and are **not** experimental results. Output of `python -m unittest -v test_pipeline`:'),
    ...code(testLog.split('\n').filter((l) => / \.\.\. |^Ran |^OK|^Python/.test(l)).map((l) => l.replace(/ \(test_pipeline\.[^)]+\)/, '')).join('\n')),
    H2('9.5 First pilot results'),
    P('Pilot: one run per condition, 10-second window, low-end device [[FILL: model]], Flutter [[FILL: version]], date [[FILL]]. Values are taken from results/pilot/analysis/runs.csv.'),
    table(['Lib', 'Hz', 'Frames', 'Achieved Hz', 'Build p95, ms', 'Raster p95, ms', 'Jank %', 'GC/s'],
      [10, 30, 60, 120].flatMap((hz) => ['bloc', 'riverpod'].map((lib) => [lib, String(hz), '[[ ]]', '[[ ]]', '[[ ]]', '[[ ]]', '[[ ]]', '[[ ]]']))
      , [1300, 700, 1000, 1300, 1300, 1300, 1000, 900], { size: 18 }),
    Caption('Table 1. Pilot output (to be filled from the actual run; one run per cell, so no statistical conclusions are drawn).'),
    P('[[FILL: 2–3 sentences describing what the pilot shows, e.g. whether jank appears at 60/120 Hz, whether achieved Hz stays close to nominal, how large the run time and file sizes are.]]'),
    H2('9.6 Problems and limitations found during the first implementation'),
    N('**The standard summary is not enough.** `TimelineSummary` gives 90th/99th percentiles and its own missed-budget count, but no 95th percentile. We added our own recorder for raw FrameTiming data.', 'steps2'),
    N('**Timers do not guarantee the update rate.** Dart’s `Timer.periodic` may fire less often than requested when the UI isolate is overloaded, so at 120 updates/s the real rate may be lower than nominal. We now count emitted samples and flag runs below 95 %. If this happens often at 120 Hz, the frequency factor itself becomes weaker, which we will report.', 'steps2'),
    N('**Refresh rate of modern phones.** Many phones run at 90 or 120 Hz, which changes the frame budget (8.3 ms at 120 Hz). The budget is now computed from the measured refresh rate, the phones are locked to 60 Hz, and runs at other rates are flagged.', 'steps2'),
    N('**Lazy grid.** `GridView.builder` builds only visible tiles; on a small screen some of the 48 tiles might never be built, which would make the workload depend on the screen size. The equivalence test uses a 393 × 851 dp surface and checks that all 48 tiles are built; before the main runs we check this on both phones.', 'steps2'),
    N('**Allocation rate inside timed runs.** Connecting to the VM service from inside the app conflicts with the Dart Development Service used by `flutter drive`, and allocation tracing adds overhead to every frame. Allocation rate was therefore moved to separate diagnostic runs (Section 6, step 6). CPU load, a secondary metric in Assignment 2, is read in the same diagnostic runs.', 'steps2'),
    N('[[FILL: any error or surprise from your own pilot run, e.g. build time per run, a failed run and its cause.]]', 'steps2'),
    H2('9.7 Reproducibility record and next steps'),
    P('Flutter [[FILL]], Dart [[FILL]], flutter_bloc 9.1.1, flutter_riverpod 2.6.1; Python 3.13, numpy 2.5, scipy 1.18, pandas 3.0, matplotlib 3.11 (versions used for the pipeline tests); generator seed 42, order seed 2026; commands are listed in the repository README. Next steps: run the pilot on the mid-range phone, fix the final number of repetitions from the pilot variance, then start the main runs.'),

    // ------------------------------------------------------------------ 10
    H1('10. Methodology Alignment Table'),
    table(['Research Objective', 'Data / Evidence Needed', 'Source / Sample / Dataset', 'Collection / Instrument', 'Analysis Method', 'Evidence for RQ'], [
      ['O1. Controlled testbed', 'Proof that only the state layer differs; achieved update rate; refresh rate', 'state_bench code; all runs', 'flutter test (equivalence tests); code diff; generator counter; display.refreshRate', 'Tests pass/fail; share of runs with achieved Hz ≥ 95 % and 60 Hz', 'Makes the comparison valid: differences can be attributed to the architecture'],
      ['O2. Compare frame metrics at 10–120 Hz', 'Build and raster time (mean, p95), jank % per run', '2 libs × 4 Hz × 30 runs per device', 'FrameTiming via addTimingsCallback; integration_test + run_matrix.py', 'Median/IQR; Mann–Whitney U + Holm; Vargha–Delaney A12; permutation test of slope', 'Directly answers the RQ and tests H1'],
      ['O3. Allocation, GC and jank', 'GC events/s, peak RSS, allocation rate, jank %', 'Same runs + 3 diagnostic runs per condition', 'TimelineSummary GC counts; ProcessInfo RSS; DevTools Memory', 'Spearman ρ (GC/s vs jank); Mann–Whitney on GC/s; descriptive allocation rate', 'Explains the mechanism behind differences (SQ1, H2)'],
      ['O4. Device class', 'O2 metrics on both phones', 'Low-end and mid-range phone (purposive)', 'Same protocol on both devices', 'O2 tests per device; comparison of |A12 − 0.5| between devices', 'Shows the boundary condition of the answer (SQ2, H3)'],
    ], [1500, 1700, 1500, 1800, 1800, 1500], { size: 17 }),

    // ------------------------------------------------------------------ 11
    H1('11. References'),
    ...[
      'Agathon, M. A. N., Nurlaili, A. L., & Al Haromainy, M. M. (2025). Comparative analysis of memory and render performance: BLoC vs Provider on low-end devices. *bit-Tech, 8*(2), 2442–2451. https://doi.org/10.32877/bt.v8i2.3268',
      'Arcuri, A., & Briand, L. (2011). A practical guide for using statistical tests to assess randomized algorithms in software engineering. In *Proceedings of the 33rd International Conference on Software Engineering (ICSE ’11)* (pp. 1–10). ACM. https://doi.org/10.1145/1985793.1985795',
      'Bloc Library. (n.d.). *Bloc documentation*. Retrieved October 2026, from https://bloclibrary.dev',
      'Callan, J., & Petke, J. (2021). Improving Android app responsiveness through automated frame rate reduction. In U.-M. O’Reilly & X. Devroey (Eds.), *Search-Based Software Engineering. SSBSE 2021* (Lecture Notes in Computer Science, Vol. 12914, pp. 136–150). Springer. https://doi.org/10.1007/978-3-030-88106-1_10',
      'Flutter. (n.d.-a). *Flutter performance profiling*. Retrieved October 2026, from https://docs.flutter.dev/perf/ui-performance',
      'Flutter. (n.d.-b). *Measure performance with an integration test*. Retrieved October 2026, from https://docs.flutter.dev/cookbook/testing/integration/profiling',
      'Flutter. (n.d.-c). *FrameTiming class* [API documentation]. Retrieved October 2026, from https://api.flutter.dev/flutter/dart-ui/FrameTiming-class.html',
      'Georges, A., Buytaert, D., & Eeckhout, L. (2007). Statistically rigorous Java performance evaluation. In *Proceedings of the 22nd ACM SIGPLAN Conference on Object-Oriented Programming Systems, Languages and Applications (OOPSLA ’07)* (pp. 57–76). ACM. https://doi.org/10.1145/1297027.1297033',
      'Holm, S. (1979). A simple sequentially rejective multiple test procedure. *Scandinavian Journal of Statistics, 6*(2), 65–70.',
      'Kalibera, T., & Jones, R. (2013). Rigorous benchmarking in reasonable time. In *Proceedings of the 2013 International Symposium on Memory Management (ISMM ’13)* (pp. 63–74). ACM. https://doi.org/10.1145/2464157.2464160',
      'Mytkowicz, T., Diwan, A., Hauswirth, M., & Sweeney, P. F. (2009). Producing wrong data without doing anything obviously wrong! In *Proceedings of the 14th International Conference on Architectural Support for Programming Languages and Operating Systems (ASPLOS ’09)* (pp. 265–276). ACM. https://doi.org/10.1145/1508244.1508275',
      'Prayoga, R. R., Syalsabila, A., Munawar, G., & Jumiyani, R. (2021). Performance analysis of BLoC and Provider state management library on Flutter. *Jurnal Mantik, 5*(3), 1591–1597. https://iocscience.org/ejournal/index.php/mantik/article/view/1539',
      'Puryanto, J. A., & Akbar, H. (2025). Performance analysis of Provider and Riverpod state management library on Flutter applications. *Journal of Technology and Informatics (JoTI), 7*(2), 190–200. https://doi.org/10.37802/joti.v7i2.1164',
      'Riverpod. (n.d.). *Riverpod documentation*. Retrieved October 2026, from https://riverpod.dev',
      'Vargha, A., & Delaney, H. D. (2000). A critique and improvement of the CL common language effect size statistics of McGraw and Wong. *Journal of Educational and Behavioral Statistics, 25*(2), 101–132. https://doi.org/10.3102/10769986025002101',
      'Wohlin, C., Runeson, P., Höst, M., Ohlsson, M. C., Regnell, B., & Wesslén, A. (2012). *Experimentation in software engineering*. Springer. https://doi.org/10.1007/978-3-642-29044-2',
      'Zulistiyan, M., Adrian, M., & Wibowo, Y. F. A. (2024). Performance analysis of BLoC and GetX state management library on Flutter. *Journal of Information System Research (JOSH), 5*(2), 583–591. https://doi.org/10.47065/josh.v5i2.4698',
    ].map((r) => P(r, { align: AlignmentType.LEFT, indent: { left: 540, hanging: 540 } })),

    // ------------------------------------------------------------------ 12
    new Paragraph({ children: [new PageBreak()] }),
    H1('12. Appendix'),
    H2('Appendix A. Repository structure'),
    ...code(`state_bench/
  pubspec.yaml               pinned versions (flutter_bloc 9.1.1, flutter_riverpod 2.6.1)
  lib/bench/config.dart      run parameters from --dart-define
  lib/bench/telemetry.dart   DashboardState, TelemetrySink, UpdateGenerator
  lib/bench/frame_recorder.dart
  lib/bench/bench_app.dart   BenchController, BenchApp
  lib/ui/dashboard.dart      shared UI
  lib/variants/bloc_variant.dart
  lib/variants/riverpod_variant.dart
  test/equivalence_test.dart
  integration_test/benchmark_test.dart
  test_driver/perf_driver.dart
  tool/run_matrix.py
  analysis/metrics.py  stats_tools.py  analyze.py  test_pipeline.py
  results/<pilot|main>/<low|mid>/   raw JSON, run_log.csv, environment.json`),
    H2('Appendix B. Code excerpts'),
    P('**B.1 BLoC variant** (lib/variants/bloc_variant.dart)'),
    ...code(excerpt('lib/variants/bloc_variant.dart', 'sealed class DashboardEvent', 'Future<void> dispose()') + '\n}'),
    ...code(excerpt('lib/variants/bloc_variant.dart', 'tileBuilder: (i)', 'TileView(index: i')),
    P('**B.2 Riverpod variant** (lib/variants/riverpod_variant.dart)'),
    ...code(excerpt('lib/variants/riverpod_variant.dart', 'class DashboardNotifier', 'NotifierProvider<DashboardNotifier')),
    ...code(excerpt('lib/variants/riverpod_variant.dart', 'tileBuilder: (i)', 'value: ref.watch')),
    P('**B.3 Update generator** (lib/bench/telemetry.dart)'),
    ...code(excerpt('lib/bench/telemetry.dart', 'void start() {', 'sink.push(TelemetrySample')),
    P('**B.4 One benchmark run** (integration_test/benchmark_test.dart)'),
    ...code(excerpt('integration_test/benchmark_test.dart', 'binding.framePolicy', "reportKey: 'timeline'")),
    P('**B.5 Jank and percentile computation** (analysis/metrics.py)'),
    ...code(excerpt('analysis/metrics.py', 'def frame_metrics', '"budget_ms"')),
    H2('Appendix C. O1 equivalence test (test/equivalence_test.dart)'),
    ...code(excerpt('test/equivalence_test.dart', 'for (final lib in StateLib.values)', 'await controller.dispose();')),
    H2('Appendix D. Data dictionary (runs.csv)'),
    table(['Column', 'Unit', 'Meaning'], [
      ['run_id', '–', 'device class_lib_Hz_repetition, e.g. low_bloc_60_07'],
      ['device, lib, hz', '–', 'Independent variables'],
      ['frames, fps', 'count, 1/s', 'Frames in the 30-s window and frames per second'],
      ['build_mean_ms, build_p95_ms', 'ms', 'UI-thread build time per frame: mean and 95th percentile'],
      ['raster_mean_ms, raster_p95_ms', 'ms', 'Raster-thread time per frame: mean and 95th percentile'],
      ['jank_pct', '%', 'Frames with build or raster time > budget'],
      ['budget_ms', 'ms', '1000 / refresh rate (16.67 at 60 Hz)'],
      ['achieved_hz, refresh_rate_hz', '1/s, Hz', 'Manipulation checks'],
      ['gc_new, gc_old, gc_per_s', 'count, 1/s', 'GC events in the traced period'],
      ['peak_rss_mb', 'MB', 'Highest resident memory sample'],
    ], [3000, 1300, 5000], { size: 18 }),
    H2('Appendix E. Device preparation checklist (per session)'),
    ...['USB debugging on; phone connected by cable; `adb devices` shows it',
      'Display refresh rate locked to 60 Hz; adaptive brightness off, brightness 50 %',
      'Airplane mode on; all other apps closed; battery saver and game modes off',
      'Battery ≥ 50 %; phone on a table, no case; room temperature noted',
      'All 48 tiles visible on screen without scrolling (checked once per phone)',
      'Run: `python tool/run_matrix.py --device <id> --device-class <low|mid>`'].map((t) => B(t)),
    H2('Appendix F. Pilot evidence'),
    P('[[FILL: screenshot of the terminal with run_matrix.py --pilot, screenshot of results/pilot/analysis/runs.csv, and the plot jank_pct.png produced by analyze.py.]]'),
  ];
};
