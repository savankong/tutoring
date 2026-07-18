import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import '../models/annotation.dart';
import 'annotation_painter.dart';

Future<ui.Image> decodeImageFile(File file) async {
  final bytes = await file.readAsBytes();
  final codec = await ui.instantiateImageCodec(bytes);
  final frame = await codec.getNextFrame();
  return frame.image;
}

/// Flattens [baseImage] and [annotations] into a single PNG at the base
/// image's full resolution. Annotations are painted into an isolated layer
/// first so eraser strokes (`BlendMode.clear`) only punch through drawn
/// ink, never the photo underneath.
Future<Uint8List> renderAnnotatedImage({
  required ui.Image baseImage,
  required List<Annotation> annotations,
}) async {
  final size = ui.Size(baseImage.width.toDouble(), baseImage.height.toDouble());
  final recorder = ui.PictureRecorder();
  final canvas = ui.Canvas(recorder);

  canvas.drawImage(baseImage, ui.Offset.zero, ui.Paint());

  canvas.saveLayer(ui.Offset.zero & size, ui.Paint());
  for (final annotation in annotations) {
    paintAnnotation(canvas, annotation);
  }
  canvas.restore();

  final picture = recorder.endRecording();
  final image = await picture.toImage(baseImage.width, baseImage.height);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  return byteData!.buffer.asUint8List();
}
