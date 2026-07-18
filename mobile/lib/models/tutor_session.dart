/// A completed capture: the annotated image plus the OCR'd question and the
/// tutor's typed answer. Sessions live in memory only for now (see
/// `providers/session_provider.dart`) — no local DB or cloud sync yet.
class TutorSession {
  TutorSession({
    required this.id,
    required this.createdAt,
    required this.imagePath,
    this.studentName = '',
    this.ocrText = '',
    this.answerText = '',
  });

  final String id;
  final DateTime createdAt;
  final String imagePath;
  final String studentName;
  final String ocrText;
  final String answerText;
}
