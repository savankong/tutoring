import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';

import '../providers/session_provider.dart';
import '../services/ocr_service.dart';
import '../services/storage_service.dart';
import 'edit_screen.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  CameraController? _controller;
  final _ocrService = OcrService();
  final _storageService = StorageService();

  String? _error;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    final status = await Permission.camera.request();
    if (!status.isGranted) {
      setState(() => _error = 'Camera permission is required to capture a question.');
      return;
    }

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _error = 'No camera found on this device.');
        return;
      }
      final backCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );
      await controller.initialize();
      if (!mounted) return;
      setState(() => _controller = controller);
    } catch (e) {
      setState(() => _error = 'Could not start the camera: $e');
    }
  }

  Future<void> _captureAndRecognize() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized || _isCapturing) return;

    setState(() => _isCapturing = true);
    try {
      final photo = await controller.takePicture();
      final sessionId = const Uuid().v4();
      final savedPath = await _storageService.newCapturePath(sessionId);
      await File(photo.path).copy(savedPath);

      final ocrText = await _ocrService.recognizeText(savedPath);

      if (!mounted) return;
      context.read<SessionProvider>().startCapture(imagePath: savedPath, ocrText: ocrText);
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => EditScreen(sessionId: sessionId)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Capture failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _isCapturing = false);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    _ocrService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(title: const Text('Capture Question')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error!, style: const TextStyle(color: Colors.white), textAlign: TextAlign.center),
        ),
      );
    }

    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        Positioned.fill(child: CameraPreview(controller)),
        Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: FloatingActionButton.large(
            onPressed: _isCapturing ? null : _captureAndRecognize,
            child: _isCapturing
                ? const CircularProgressIndicator(color: Colors.white)
                : const Icon(Icons.camera_alt),
          ),
        ),
      ],
    );
  }
}
