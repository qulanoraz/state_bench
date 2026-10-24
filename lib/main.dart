import 'package:flutter/material.dart';

import 'bench/bench_app.dart';
import 'bench/config.dart';

/// Manual mode: `flutter run --profile --dart-define=LIB=riverpod --dart-define=HZ=60`
/// starts the generator immediately so the run can be inspected in DevTools.
void main() {
  final controller = BenchController(BenchConfig.fromEnvironment());
  runApp(BenchApp(controller: controller));
  WidgetsBinding.instance.addPostFrameCallback((_) => controller.start());
}
