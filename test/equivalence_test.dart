import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:state_bench/bench/bench_app.dart';
import 'package:state_bench/bench/config.dart';
import 'package:state_bench/bench/telemetry.dart';

/// Functional-equivalence tests for Objective O1: both variants must render
/// the same widget tree and show the same values for the same input.
/// Run with: flutter test
void main() {
  for (final lib in StateLib.values) {
    testWidgets('${lib.name}: renders all 48 tiles and applies an update',
        (tester) async {
      // Typical phone surface (393 x 851 dp) so that all tiles are laid out.
      tester.view.physicalSize = const Size(1080, 2340);
      tester.view.devicePixelRatio = 2.75;
      addTearDown(tester.view.reset);

      final controller =
          BenchController(BenchConfig(lib: lib, hz: 60, tiles: 48));
      await tester.pumpWidget(BenchApp(controller: controller));

      expect(find.byType(GridView), findsOneWidget);
      expect(find.text('0.0'), findsNWidgets(48));

      final values = List<double>.generate(48, (i) => i + 0.4);
      controller.sink.push(TelemetrySample(1, values));
      await tester.pump(); // BLoC delivers the event asynchronously
      await tester.pump();

      expect(find.text('0.4'), findsOneWidget); // first tile
      expect(find.text('47.4'), findsOneWidget); // last tile
      expect(find.text('0.0'), findsNothing); // every tile was updated
      expect(find.textContaining('tick 1'), findsOneWidget);

      await controller.dispose();
    });
  }

  test('same seed gives the same update sequence for both variants', () {
    List<List<double>> run() {
      final captured = <TelemetrySample>[];
      final g = UpdateGenerator(
          hz: 60, tiles: 4, seed: 42, sink: _CaptureSink(captured));
      for (var i = 0; i < 3; i++) {
        g.emitOnce();
      }
      return captured.map((s) => s.values).toList();
    }

    expect(run(), run());
  });
}

class _CaptureSink implements TelemetrySink {
  _CaptureSink(this.out);
  final List<TelemetrySample> out;
  @override
  void push(TelemetrySample sample) => out.add(sample);
  @override
  Future<void> dispose() async {}
}
