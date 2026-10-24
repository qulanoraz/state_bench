import 'package:flutter_driver/flutter_driver.dart' as driver;
import 'package:integration_test/integration_test_driver.dart';

/// Host-side driver: writes
///   build/run.timeline_summary.json  (DevTools-style summary incl. GC counts)
///   build/run_frames.json            (raw per-frame data + run metadata)
/// The full timeline is not kept on disk to save space.
Future<void> main() {
  return integrationDriver(
    responseDataCallback: (data) async {
      if (data == null) return;
      final timeline = driver.Timeline.fromJson(
        data['timeline'] as Map<String, dynamic>,
      );
      final summary = driver.TimelineSummary.summarize(timeline);
      await summary.writeTimelineToFile(
        'run',
        pretty: true,
        includeSummary: true,
      );
      await writeResponseData(
        <String, dynamic>{'frames': data['frames'], 'meta': data['meta']},
        testOutputFilename: 'run_frames',
        destinationDirectory: 'build',
      );
    },
  );
}
