import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/tutor_session.dart';
import '../providers/session_provider.dart';
import '../services/storage_service.dart';
import 'home_screen.dart';

class ShareScreen extends StatefulWidget {
  const ShareScreen({super.key, required this.session});

  final TutorSession session;

  @override
  State<ShareScreen> createState() => _ShareScreenState();
}

class _ShareScreenState extends State<ShareScreen> {
  final _storageService = StorageService();
  late final TextEditingController _answerController;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _answerController = TextEditingController(text: widget.session.answerText);
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action, {String? successMessage}) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
      if (successMessage != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(successMessage)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.session;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Share'),
        actions: [
          IconButton(
            icon: const Icon(Icons.home),
            tooltip: 'Home',
            onPressed: () => Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const HomeScreen()),
              (route) => false,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(File(session.imagePath)),
              ),
              const SizedBox(height: 16),
              if (session.ocrText.isNotEmpty) ...[
                Text('Question', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(session.ocrText),
                const SizedBox(height: 16),
              ],
              Text('Answer', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              TextField(
                controller: _answerController,
                maxLines: 3,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  hintText: 'Type the answer...',
                ),
                onChanged: (text) => context.read<SessionProvider>().updateAnswerText(text),
              ),
              const SizedBox(height: 24),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  FilledButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _run(
                              () => _storageService.saveToGallery(session.imagePath),
                              successMessage: 'Saved to Photos',
                            ),
                    icon: const Icon(Icons.save_alt),
                    label: const Text('Save to Gallery'),
                  ),
                  FilledButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _run(
                              () => _storageService.shareFiles(
                                [session.imagePath],
                                text: _answerController.text,
                              ),
                            ),
                    icon: const Icon(Icons.share),
                    label: const Text('Share Image'),
                  ),
                  FilledButton.icon(
                    onPressed: _busy
                        ? null
                        : () => _run(() async {
                              final pdfPath = await _storageService.exportPdf(
                                sessionId: session.id,
                                imageFile: File(session.imagePath),
                                question: session.ocrText,
                                answer: _answerController.text,
                              );
                              await _storageService.shareFiles([pdfPath]);
                            }),
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('Export PDF'),
                  ),
                ],
              ),
              if (_busy) const Padding(
                padding: EdgeInsets.only(top: 16),
                child: Center(child: CircularProgressIndicator()),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
