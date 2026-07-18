import 'package:flutter/material.dart';

import '../models/annotation.dart';

/// Paints a single [Annotation] onto [canvas]. Shared by the live editing
/// canvas (`widgets/drawing_canvas.dart`) and the full-resolution export
/// renderer (`utils/image_utils.dart`) so on-screen and exported output
/// never drift apart.
void paintAnnotation(Canvas canvas, Annotation annotation) {
  switch (annotation) {
    case StrokeAnnotation():
      _paintStroke(canvas, annotation);
    case TextAnnotation():
      _paintText(canvas, annotation);
  }
}

void _paintStroke(Canvas canvas, StrokeAnnotation stroke) {
  if (stroke.points.length < 2) return;
  final paint = Paint()
    ..color = stroke.color
    ..strokeWidth = stroke.width
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round
    ..style = PaintingStyle.stroke
    ..blendMode = stroke.isEraser ? BlendMode.clear : BlendMode.srcOver;

  final path = Path()..moveTo(stroke.points.first.dx, stroke.points.first.dy);
  for (final point in stroke.points.skip(1)) {
    path.lineTo(point.dx, point.dy);
  }
  canvas.drawPath(path, paint);
}

void _paintText(Canvas canvas, TextAnnotation annotation) {
  final painter = TextPainter(
    text: TextSpan(
      text: annotation.text,
      style: TextStyle(
        color: annotation.color,
        fontSize: annotation.fontSize,
        fontWeight: FontWeight.w700,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout();
  painter.paint(canvas, annotation.position);
}
