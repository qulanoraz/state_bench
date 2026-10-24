import 'dart:io' show ProcessInfo;

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:state_bench/bench/bench_app.dart';
import 'package:state_bench/bench/config.dart';
import 'package:state_bench/bench/frame_recorder.dart';

/// One benchmark run = one (LIB, HZ) condition on one device.
/// Run through tool/run_matrix.py, or manually:
///   flutter drive --profile --no-dds \
///     --driver=test_driver/perf_driver.dart \
///     --target=integration_test/benchmark_test.dart \
///     --dart-define=LIB=bloc --dart-define=HZ=60
void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('state update benchmark', (tester) async {
    final cfg = BenchConfig.fromEnvironment();
    final controller = BenchController(cfg);
    final recorder = FrameRecorder()..attach();

    await tester.pumpWidget(BenchApp(controller: controller));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('dashboard_grid')), findsOneWidget);

    // From here on, frames are scheduled by the engine/vsync as on a real
    // device, not by tester.pump (default policy would distort timings).
    binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.benchmarkLive;

    final display = tester.view.display;
    final rssBefore = ProcessInfo.currentRss;

    await binding.traceAction(
      () async {
        recorder.start();
        controller.start();
        await Future<void>.delayed(
          Duration(seconds: cfg.warmupSeconds + cfg.measureSeconds),
        );
        controller.stop();
        // Let the engine flush the last batch of FrameTiming reports.
        await Future<void>.delayed(const Duration(seconds: 2));
        recorder.stop();
      },
      streams: const <String>['Dart', 'Embedder', 'GC'],
      reportKey: 'timeline',
    );

    binding.reportData ??= <String, dynamic>{};
    binding.reportData!['frames'] = recorder.framesToJson();
    binding.reportData!['meta'] = <String, Object>{
      ...cfg.toJson(),
      'refresh_rate_hz': display.refreshRate,
      'samples_emitted': controller.generator.emitted,
      'achieved_hz': controller.achievedHz,
      'rss_before_bytes': rssBefore,
      'rss_samples_bytes': recorder.rssSamples,
      'max_rss_bytes': ProcessInfo.maxRss,
    };

    recorder.detach();
    await controller.dispose();
  }, timeout: const Timeout(Duration(minutes: 5)));
}
