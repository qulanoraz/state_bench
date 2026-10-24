import 'package:flutter/material.dart';

import '../variants/bloc_variant.dart';
import '../variants/riverpod_variant.dart';
import 'config.dart';
import 'telemetry.dart';

/// Owns the sink and the generator for one run.
class BenchController {
  BenchController(this.config)
      : sink = switch (config.lib) {
          StateLib.bloc => BlocSink(config.tiles),
          StateLib.riverpod => RiverpodSink(config.tiles),
        } {
    generator = UpdateGenerator(
      hz: config.hz,
      tiles: config.tiles,
      seed: config.seed,
      sink: sink,
    );
  }

  final BenchConfig config;
  final TelemetrySink sink;
  late final UpdateGenerator generator;

  void start() => generator.start();
  void stop() => generator.stop();
  Future<void> dispose() => sink.dispose();

  /// Achieved update rate (manipulation check for the HZ factor).
  double get achievedHz {
    final s = generator.elapsed.inMicroseconds / Duration.microsecondsPerSecond;
    return s == 0 ? 0 : generator.emitted / s;
  }
}

class BenchApp extends StatelessWidget {
  const BenchApp({super.key, required this.controller});

  final BenchController controller;

  @override
  Widget build(BuildContext context) {
    final cfg = controller.config;
    final sink = controller.sink;
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: switch (sink) {
        BlocSink s => BlocDashboard(sink: s, tiles: cfg.tiles),
        RiverpodSink s => RiverpodDashboard(sink: s, tiles: cfg.tiles),
        _ => throw StateError('Unknown sink ${sink.runtimeType}'),
      },
    );
  }
}
