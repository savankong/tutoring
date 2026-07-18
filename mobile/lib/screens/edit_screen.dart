import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/session_provider.dart';
import '../models/tutor_session.dart';
import '../services/storage_service.dart';
import '../utils/image_utils.dart';
import '../widgets/color_picker.dart';
import '../widgets/drawing_canvas.dart';
import 'share_screen.dart';

class EditScreen extends StatefulWidget {
  const EditScreen({super.key, required this.sessionId});

  final String sessionId;

  @override
  State<EditScreen> createState() => _EditScreenState();
}

class _EditScreenState extends State<EditScreen> {
  final _storageService = StorageService();
  late Future<ui.Image> _baseImageFuture;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final imagePath = context.read<SessionProvider>().imagePath!;
    _baseImageFuture = decodeImageFile(File(imagePath));
  }

  Future<void> _placeText(Offset position) async {
    final controller = TextEditingController();
    final text = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add text'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Add'),
          ),
        ],
      ),
    );
    if (text != null && text.trim().isNotEmpty && mounted) {
      context.read<SessionProvider>().addTextAnnotation(position, text);
    }
  }

  Future<void> _finish(ui.Image baseImage) async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    try {
      final provider = context.read<SessionProvider>();
      final pngBytes = await renderAnnotatedImage(
        baseImage: baseImage,
        annotations: provider.annotations,
      );
      final finalPath = await _storageService.saveAnnotatedImage(pngBytes, widget.sessionId);

      final session = TutorSession(
        id: widget.sessionId,
        createdAt: DateTime.now(),
        imagePath: finalPath,
        ocrText: provider.ocrText,
        answerText: provider.answerText,
      );
      provider.addSession(session);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ShareScreen(session: session)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not save: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Annotate'),
        actions: [
          Consumer<SessionProvider>(
            builder: (context, provider, _) => IconButton(
              icon: const Icon(Icons.undo),
              onPressed: provider.canUndo ? provider.undo : null,
            ),
          ),
          Consumer<SessionProvider>(
            builder: (context, provider, _) => IconButton(
              icon: const Icon(Icons.redo),
              onPressed: provider.canRedo ? provider.redo : null,
            ),
          ),
        ],
      ),
      body: FutureBuilder<ui.Image>(
        future: _baseImageFuture,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final baseImage = snapshot.data!;
          return Column(
            children: [
              Expanded(child: _buildCanvas(baseImage)),
              _buildToolbar(baseImage),
            ],
          );
        },
      ),
    );
  }

  Widget _buildCanvas(ui.Image baseImage) {
    return Consumer<SessionProvider>(
      builder: (context, provider, _) {
        return Center(
          child: FittedBox(
            child: SizedBox(
              width: baseImage.width.toDouble(),
              height: baseImage.height.toDouble(),
              child: GestureDetector(
                onPanStart: provider.tool == DrawTool.text
                    ? null
                    : (details) => provider.startStroke(details.localPosition),
                onPanUpdate: provider.tool == DrawTool.text
                    ? null
                    : (details) => provider.extendStroke(details.localPosition),
                onPanEnd: provider.tool == DrawTool.text ? null : (_) => provider.endStroke(),
                onTapUp: provider.tool == DrawTool.text
                    ? (details) => _placeText(details.localPosition)
                    : null,
                child: DrawingCanvas(
                  baseImage: baseImage,
                  annotations: provider.annotations,
                  currentStroke: provider.currentStroke,
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildToolbar(ui.Image baseImage) {
    return Consumer<SessionProvider>(
      builder: (context, provider, _) {
        return SafeArea(
          top: false,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, -2))],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    _ToolButton(
                      icon: Icons.edit,
                      label: 'Pen',
                      selected: provider.tool == DrawTool.pen,
                      onTap: () => provider.setTool(DrawTool.pen),
                    ),
                    _ToolButton(
                      icon: Icons.auto_fix_normal,
                      label: 'Eraser',
                      selected: provider.tool == DrawTool.eraser,
                      onTap: () => provider.setTool(DrawTool.eraser),
                    ),
                    _ToolButton(
                      icon: Icons.text_fields,
                      label: 'Text',
                      selected: provider.tool == DrawTool.text,
                      onTap: () => provider.setTool(DrawTool.text),
                    ),
                    const Spacer(),
                    FilledButton.icon(
                      onPressed: _isSaving ? null : () => _finish(baseImage),
                      icon: _isSaving
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check),
                      label: const Text('Done'),
                    ),
                  ],
                ),
                if (provider.tool != DrawTool.text) ...[
                  Row(
                    children: [
                      const Icon(Icons.line_weight, size: 18),
                      Expanded(
                        child: Slider(
                          value: provider.strokeWidth,
                          min: 2,
                          max: 24,
                          onChanged: provider.setStrokeWidth,
                        ),
                      ),
                    ],
                  ),
                ],
                if (provider.tool == DrawTool.pen)
                  ColorPicker(selected: provider.penColor, onSelect: provider.setPenColor),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ToolButton extends StatelessWidget {
  const _ToolButton({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? Theme.of(context).colorScheme.primary : Colors.grey;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color),
            Text(label, style: TextStyle(color: color, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
