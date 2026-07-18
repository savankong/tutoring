import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../models/annotation.dart';
import '../utils/annotation_painter.dart';

/// Renders the base photo plus every finalized/in-progress [Annotation] on
/// top. Sized to the image's own pixel dimensions and left to its parent
/// (a [FittedBox]) to scale for display — that way gesture coordinates
/// captured by the caller already land in the image's coordinate space with
/// no manual conversion needed.
class DrawingCanvas extends StatelessWidget {
  const DrawingCanvas({
    super.key,
    required this.baseImage,
    required this.annotations,
    this.currentStroke,
  });

  final ui.Image baseImage;
  final List<Annotation> annotations;
  final StrokeAnnotation? currentStroke;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(baseImage.width.toDouble(), baseImage.height.toDouble()),
      painter: _CanvasPainter(
        baseImage: baseImage,
        annotations: annotations,
        currentStroke: currentStroke,
      ),
    );
  }
}

class _CanvasPainter extends CustomPainter {
  _CanvasPainter({
    required this.baseImage,
    required this.annotations,
    required this.currentStroke,
  });

  final ui.Image baseImage;
  final List<Annotation> annotations;
  final StrokeAnnotation? currentStroke;

  @override
  void paint(Canvas canvas, Size size) {
    paintImage(canvas: canvas, rect: Offset.zero & size, image: baseImage, fit: BoxFit.fill);

    canvas.saveLayer(Offset.zero & size, Paint());
    for (final annotation in annotations) {
      paintAnnotation(canvas, annotation);
    }
    if (currentStroke != null) {
      paintAnnotation(canvas, currentStroke!);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CanvasPainter oldDelegate) {
    return oldDelegate.annotations != annotations || oldDelegate.currentStroke != currentStroke;
  }
}
