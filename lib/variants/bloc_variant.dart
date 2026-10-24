import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bench/telemetry.dart';
import '../ui/dashboard.dart';

// ----- BLoC: event -> stream -> new state -----

sealed class DashboardEvent {}

final class SampleArrived extends DashboardEvent {
  SampleArrived(this.sample);
  final TelemetrySample sample;
}

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc(int tiles) : super(DashboardState.initial(tiles)) {
    on<SampleArrived>(
      (event, emit) => emit(DashboardState.fromSample(event.sample)),
    );
  }
}

class BlocSink implements TelemetrySink {
  BlocSink(int tiles) : bloc = DashboardBloc(tiles);
  final DashboardBloc bloc;

  @override
  void push(TelemetrySample sample) => bloc.add(SampleArrived(sample));

  @override
  Future<void> dispose() => bloc.close();
}

/// Idiomatic BLoC wiring: one BlocProvider at the root, one BlocSelector per
/// tile so that each tile rebuilds only when its own value changes.
class BlocDashboard extends StatelessWidget {
  const BlocDashboard({super.key, required this.sink, required this.tiles});

  final BlocSink sink;
  final int tiles;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<DashboardBloc>.value(
      value: sink.bloc,
      child: Dashboard(
        tiles: tiles,
        header: BlocSelector<DashboardBloc, DashboardState, int>(
          selector: (s) => s.tick,
          builder: (_, tick) => TickHeader(label: 'BLoC', tick: tick),
        ),
        tileBuilder: (i) => BlocSelector<DashboardBloc, DashboardState, double>(
          selector: (s) => s.values[i],
          builder: (_, v) => TileView(index: i, value: v),
        ),
      ),
    );
  }
}
