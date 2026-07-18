import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/session_provider.dart';
import 'camera_screen.dart';
import 'share_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sessions = context.watch<SessionProvider>().sessions;

    return Scaffold(
      appBar: AppBar(title: const Text('Tutor Camera')),
      body: sessions.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No sessions yet.\nTap "New Session" to capture a question.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            )
          : ListView.builder(
              itemCount: sessions.length,
              itemBuilder: (context, index) {
                final session = sessions[index];
                return ListTile(
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.file(
                      File(session.imagePath),
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover,
                    ),
                  ),
                  title: Text(
                    session.ocrText.isEmpty ? '(no question text)' : session.ocrText,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(_formatTimestamp(session.createdAt)),
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ShareScreen(session: session)),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CameraScreen()),
        ),
        icon: const Icon(Icons.camera_alt),
        label: const Text('New Session'),
      ),
    );
  }

  String _formatTimestamp(DateTime dateTime) {
    final now = DateTime.now();
    final sameDay =
        dateTime.year == now.year && dateTime.month == now.month && dateTime.day == now.day;
    final time =
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    return sameDay ? time : '${dateTime.month}/${dateTime.day} $time';
  }
}
