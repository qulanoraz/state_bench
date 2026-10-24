/// Experimental configuration of one benchmark run.
///
/// Values are injected at build time with --dart-define, e.g.
///   flutter drive ... --dart-define=LIB=riverpod --dart-define=HZ=60
/// Both variants are always compiled into the same binary; the LIB value only
/// selects which one is instantiated, so the code base, UI and generator are
/// identical in every condition.
library;

const String _kLib = String.fromEnvironment('LIB', defaultValue: 'bloc');
const int _kHz = int.fromEnvironment('HZ', defaultValue: 60);
const int _kTiles = int.fromEnvironment('TILES', defaultValue: 48);
const int _kSeed = int.fromEnvironment('SEED', defaultValue: 42);
const int _kWarmupS = int.fromEnvironment('WARMUP_S', defaultValue: 5);
const int _kMeasureS = int.fromEnvironment('MEASURE_S', defaultValue: 30);
const String _kRunId = String.fromEnvironment('RUN_ID', defaultValue: 'manual');

/// Independent variable 1: state management architecture.
enum StateLib { bloc, riverpod }

class BenchConfig {
  const BenchConfig({
    required this.lib,
    required this.hz,
    this.tiles = 48,
    this.seed = 42,
    this.warmupSeconds = 5,
    this.measureSeconds = 30,
    this.runId = 'manual',
  })  : assert(hz > 0),
        assert(tiles > 0);

  factory BenchConfig.fromEnvironment() => BenchConfig(
        lib: _kLib == 'riverpod' ? StateLib.riverpod : StateLib.bloc,
        hz: _kHz,
        tiles: _kTiles,
        seed: _kSeed,
        warmupSeconds: _kWarmupS,
        measureSeconds: _kMeasureS,
        runId: _kRunId,
      );

  final StateLib lib;

  /// Independent variable 2: nominal state updates per second (10/30/60/120).
  final int hz;

  /// Number of dashboard tiles; every update changes all of them.
  final int tiles;

  /// Seed of the value generator, identical for both architectures.
  final int seed;
  final int warmupSeconds;
  final int measureSeconds;
  final String runId;

  Duration get updatePeriod =>
      Duration(microseconds: (Duration.microsecondsPerSecond / hz).round());

  Map<String, Object> toJson() => {
        'lib': lib.name,
        'hz': hz,
        'tiles': tiles,
        'seed': seed,
        'warmup_s': warmupSeconds,
        'measure_s': measureSeconds,
        'run_id': runId,
      };
}
