import 'package:flutter/material.dart';

/// Shared, architecture-agnostic UI. Both variants render exactly this tree;
/// they only supply the small "subscriber" widgets that read state.
class Dashboard extends StatelessWidget {
  const Dashboard({
    super.key,
    required this.tiles,
    required this.header,
    required this.tileBuilder,
  });

  final int tiles;
  final Widget header;

  /// Returns the architecture-specific subscriber for tile [index], which
  /// must render a [TileView].
  final Widget Function(int index) tileBuilder;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: header),
      body: GridView.builder(
        key: const ValueKey('dashboard_grid'),
        padding: const EdgeInsets.all(4),
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 6,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          childAspectRatio: 0.8,
        ),
        itemCount: tiles,
        itemBuilder: (_, i) => tileBuilder(i),
      ),
    );
  }
}

/// One telemetry tile: numeric value plus a bar proportional to it.
class TileView extends StatelessWidget {
  const TileView({super.key, required this.index, required this.value});

  final int index;
  final double value;

  @override
  Widget build(BuildContext context) {
    final fraction = (value / 100).clamp(0.0, 1.0);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.blueGrey.shade50,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('#$index', style: const TextStyle(fontSize: 10)),
            Text(
              value.toStringAsFixed(1),
              key: ValueKey('tile_value_$index'),
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            Align(
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: fraction,
                child: Container(height: 6, color: Colors.teal),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class TickHeader extends StatelessWidget {
  const TickHeader({super.key, required this.label, required this.tick});

  final String label;
  final int tick;

  @override
  Widget build(BuildContext context) =>
      Text('$label · tick $tick', key: const ValueKey('tick_header'));
}
