import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/session_provider.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TutorOcrApp());
}

class TutorOcrApp extends StatelessWidget {
  const TutorOcrApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SessionProvider(),
      child: MaterialApp(
        title: 'Tutor OCR',
        theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
        home: const HomeScreen(),
      ),
    );
  }
}
