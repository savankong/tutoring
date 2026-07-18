import 'dart:ui';

import 'package:flutter/foundation.dart';

import '../models/annotation.dart';
import '../models/tutor_session.dart';

enum DrawTool { pen, eraser, text }

/// Holds both the list of completed [TutorSession]s (in-memory only, reset
/// on app restart) and the transient state of whatever capture is currently
/// being annotated in the edit screen.
class SessionProvider extends ChangeNotifier {
  final List<TutorSession> _sessions = [];
  List<TutorSession> get sessions => List.unmodifiable(_sessions.reversed);

  String? _imagePath;
  String _ocrText = '';
  String _answerText = '';

  final List<Annotation> _annotations = [];
  final List<Annotation> _redoStack = [];
  StrokeAnnotation? _currentStroke;

  DrawTool _tool = DrawTool.pen;
  Color _penColor = const Color(0xFF000000);
  double _strokeWidth = 6;

  String? get imagePath => _imagePath;
  String get ocrText => _ocrText;
  String get answerText => _answerText;
  List<Annotation> get annotations => List.unmodifiable(_annotations);
  StrokeAnnotation? get currentStroke => _currentStroke;
  DrawTool get tool => _tool;
  Color get penColor => _penColor;
  double get strokeWidth => _strokeWidth;
  bool get canUndo => _annotations.isNotEmpty;
  bool get canRedo => _redoStack.isNotEmpty;

  void startCapture({required String imagePath, required String ocrText}) {
    _imagePath = imagePath;
    _ocrText = ocrText;
    _answerText = '';
    _annotations.clear();
    _redoStack.clear();
    _currentStroke = null;
    notifyListeners();
  }

  void updateOcrText(String text) {
    _ocrText = text;
    notifyListeners();
  }

  void updateAnswerText(String text) {
    _answerText = text;
    notifyListeners();
  }

  void setTool(DrawTool tool) {
    _tool = tool;
    notifyListeners();
  }

  void setPenColor(Color color) {
    _penColor = color;
    notifyListeners();
  }

  void setStrokeWidth(double width) {
    _strokeWidth = width;
    notifyListeners();
  }

  void startStroke(Offset point) {
    _currentStroke = StrokeAnnotation(
      color: _penColor,
      width: _strokeWidth,
      isEraser: _tool == DrawTool.eraser,
    )..points.add(point);
    notifyListeners();
  }

  void extendStroke(Offset point) {
    _currentStroke?.points.add(point);
    notifyListeners();
  }

  void endStroke() {
    final stroke = _currentStroke;
    _currentStroke = null;
    if (stroke != null && stroke.points.length > 1) {
      _annotations.add(stroke);
      _redoStack.clear();
    }
    notifyListeners();
  }

  void addTextAnnotation(Offset position, String text) {
    if (text.trim().isEmpty) return;
    _annotations.add(
      TextAnnotation(text: text.trim(), position: position, color: _penColor),
    );
    _redoStack.clear();
    notifyListeners();
  }

  void undo() {
    if (_annotations.isEmpty) return;
    _redoStack.add(_annotations.removeLast());
    notifyListeners();
  }

  void redo() {
    if (_redoStack.isEmpty) return;
    _annotations.add(_redoStack.removeLast());
    notifyListeners();
  }

  void addSession(TutorSession session) {
    _sessions.add(session);
    notifyListeners();
  }
}
