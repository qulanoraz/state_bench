import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../bench/telemetry.dart';
import '../ui/dashboard.dart';

// ----- Riverpod: notifier in a provider graph -> dependent widgets -----

/// Number of tiles, overridden per run.
final tilesProvider = Provider<int>((ref) => throw UnimplementedError());

class DashboardNotifier extends Notifier<DashboardState> {
  @override
  DashboardState build() => DashboardState.initial(ref.watch(tilesProvider));

  void apply(TelemetrySample sample) =>
      state = DashboardState.fromSample(sample);
}

final dashboardProvider =
    NotifierProvider<DashboardNotifier, DashboardState>(DashboardNotifier.new);

class RiverpodSink implements TelemetrySink {
  RiverpodSink(int tiles)
      : container = ProviderContainer(
          overrides: [tilesProvider.overrideWithValue(tiles)],
        );

  final ProviderContainer container;

  @override
  void push(TelemetrySample sample) =>
      container.read(dashboardProvider.notifier).apply(sample);

  @override
  Future<void> dispose() async => container.dispose();
}

/// Idiomatic Riverpod wiring: one scope at the root, one select() per tile,
/// mirroring BlocSelector in the BLoC variant.
class RiverpodDashboard extends StatelessWidget {
  const RiverpodDashboard({super.key, required this.sink, required this.tiles});

  final RiverpodSink sink;
  final int tiles;

  @override
  Widget build(BuildContext context) {
    return UncontrolledProviderScope(
      container: sink.container,
      child: Dashboard(
        tiles: tiles,
        header: Consumer(
          builder: (_, ref, __) => TickHeader(
            label: 'Riverpod',
            tick: ref.watch(dashboardProvider.select((s) => s.tick)),
          ),
        ),
        tileBuilder: (i) => Consumer(
          builder: (_, ref, __) => TileView(
            index: i,
            value: ref.watch(dashboardProvider.select((s) => s.values[i])),
          ),
        ),
      ),
    );
  }
}
