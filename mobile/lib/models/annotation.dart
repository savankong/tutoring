import 'dart:ui';

/// Something drawn on top of the captured photo. Coordinates are always in
/// the base image's own pixel space (the editor maps screen taps into that
/// space via a [FittedBox], so no separate scale factor is needed at paint
/// time — see `widgets/drawing_canvas.dart`).
sealed class Annotation {
  const Annotation();
}

class StrokeAnnotation extends Annotation {
  StrokeAnnotation({
    required this.color,
    required this.width,
    this.isEraser = false,
    List<Offset>? points,
  }) : points = points ?? <Offset>[];

  final List<Offset> points;
  final Color color;
  final double width;
  final bool isEraser;
}

class TextAnnotation extends Annotation {
  const TextAnnotation({
    required this.text,
    required this.position,
    required this.color,
    this.fontSize = 28,
  });

  final String text;
  final Offset position;
  final Color color;
  final double fontSize;
}
