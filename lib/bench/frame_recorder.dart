import 'dart:async';
import 'dart:io' show ProcessInfo;
import 'dart:ui' show FramePhase, FrameTiming;

import 'package:flutter/scheduler.dart';

/// Records every FrameTiming reported by the engine plus a 1 Hz RSS sample.
///
/// Raw per-frame data are kept (instead of only the DevTools summary) because
/// the summary reports the 90th/99th percentiles, while the study needs the
/// 95th percentile and its own jank definition. Warm-up trimming is done
/// later in the analysis pipeline using the vsync timestamps.
class FrameRecorder {
  final List<FrameTiming> _frames = <FrameTiming>[];
  final List<int> _rssSamples = <int>[];
  bool _recording = false;
  Timer? _rssTimer;

  void _onTimings(List<FrameTiming> timings) {
    if (_recording) _frames.addAll(timings);
  }

  void attach() => SchedulerBinding.instance.addTimingsCallback(_onTimings);

  void detach() => SchedulerBinding.instance.removeTimingsCallback(_onTimings);

  void start() {
    _frames.clear();
    _rssSamples.clear();
    _recording = true;
    _rssTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _rssSamples.add(ProcessInfo.currentRss),
    );
  }

  void stop() {
    _recording = false;
    _rssTimer?.cancel();
  }

  int get frameCount => _frames.length;

  List<Map<String, int>> framesToJson() => _frames
      .map((f) => <String, int>{
            'vsync_start_us': f.timestampInMicroseconds(FramePhase.vsyncStart),
            'build_us': f.buildDuration.inMicroseconds,
            'raster_us': f.rasterDuration.inMicroseconds,
            'total_us': f.totalSpan.inMicroseconds,
            'vsync_overhead_us': f.vsyncOverhead.inMicroseconds,
          })
      .toList(growable: false);

  List<int> get rssSamples => List<int>.unmodifiable(_rssSamples);
}
