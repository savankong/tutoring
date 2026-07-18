import 'dart:io';
import 'dart:typed_data';

import 'package:gal/gal.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

/// File I/O, gallery saves, PDF export, and system-share for tutor
/// sessions. Everything is local disk — no cloud backend yet.
class StorageService {
  Future<Directory> _sessionsDir() async {
    final dir = await getApplicationDocumentsDirectory();
    final sessionsDir = Directory('${dir.path}/sessions');
    if (!await sessionsDir.exists()) {
      await sessionsDir.create(recursive: true);
    }
    return sessionsDir;
  }

  Future<String> newCapturePath(String sessionId) async {
    final dir = await _sessionsDir();
    return '${dir.path}/$sessionId-capture.jpg';
  }

  Future<String> saveAnnotatedImage(Uint8List pngBytes, String sessionId) async {
    final dir = await _sessionsDir();
    final file = File('${dir.path}/$sessionId.png');
    await file.writeAsBytes(pngBytes, flush: true);
    return file.path;
  }

  Future<String> exportPdf({
    required String sessionId,
    required File imageFile,
    required String question,
    required String answer,
  }) async {
    final dir = await _sessionsDir();
    final imageBytes = await imageFile.readAsBytes();
    final image = pw.MemoryImage(imageBytes);

    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(child: pw.Image(image, fit: pw.BoxFit.contain)),
              pw.SizedBox(height: 16),
              if (question.isNotEmpty) ...[
                pw.Text('Question', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                pw.Text(question),
                pw.SizedBox(height: 8),
              ],
              if (answer.isNotEmpty) ...[
                pw.Text('Answer', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                pw.Text(answer),
              ],
            ],
          );
        },
      ),
    );

    final file = File('${dir.path}/$sessionId.pdf');
    await file.writeAsBytes(await doc.save(), flush: true);
    return file.path;
  }

  Future<void> saveToGallery(String imagePath) async {
    final hasAccess = await Gal.requestAccess();
    if (!hasAccess) {
      throw Exception('Photo library access denied.');
    }
    await Gal.putImage(imagePath, album: 'Tutor OCR');
  }

  Future<void> shareFiles(List<String> paths, {String? text}) async {
    await SharePlus.instance.share(
      ShareParams(files: paths.map(XFile.new).toList(), text: text),
    );
  }
}
