import 'dart:async';
import 'dart:math';

/// One synthetic telemetry update (e.g. a set of live sensor/price values).
class TelemetrySample {
  TelemetrySample(this.tick, this.values);

  final int tick;
  final List<double> values;
}

/// Immutable UI state shared by both architectures, so that the state
/// object itself is identical and only its propagation mechanism differs.
class DashboardState {
  const DashboardState(this.tick, this.values);

  factory DashboardState.initial(int tiles) =>
      DashboardState(0, List<double>.filled(tiles, 0, growable: false));

  factory DashboardState.fromSample(TelemetrySample s) =>
      DashboardState(s.tick, s.values);

  final int tick;
  final List<double> values;
}

/// The only point where the generator touches the state layer.
/// Implemented once for BLoC and once for Riverpod.
abstract interface class TelemetrySink {
  void push(TelemetrySample sample);
  Future<void> dispose();
}

/// Synthetic update generator: produces [hz] samples per second with a
/// seeded RNG, so both architectures receive exactly the same sequence.
class UpdateGenerator {
  UpdateGenerator({
    required this.hz,
    required this.tiles,
    required int seed,
    required this.sink,
  }) : _rng = Random(seed);

  final int hz;
  final int tiles;
  final TelemetrySink sink;
  final Random _rng;

  Timer? _timer;
  int _tick = 0;
  final Stopwatch _clock = Stopwatch();

  /// Number of samples actually emitted (manipulation check: Timer.periodic
  /// may fire less often than requested when the UI isolate is overloaded).
  int get emitted => _tick;
  Duration get elapsed => _clock.elapsed;

  void start() {
    final period =
        Duration(microseconds: (Duration.microsecondsPerSecond / hz).round());
    _clock.start();
    _timer = Timer.periodic(period, (_) => emitOnce());
  }

  /// Produces and pushes one sample (also used directly by unit tests).
  void emitOnce() {
    _tick++;
    final values = List<double>.generate(
      tiles,
      (_) => _rng.nextDouble() * 100,
      growable: false,
    );
    sink.push(TelemetrySample(_tick, values));
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _clock.stop();
  }
}
