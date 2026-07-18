# Tutor OCR App (Flutter)

Capture a question with the camera, run on-device OCR (Google ML Kit), draw/type
annotations over the photo, then share the result as an image or PDF.

## Important: this needs a Mac to run on an iPhone

This code was written in a Linux environment with no Flutter SDK installed, so it
has **not** been built or run — treat it as a solid first draft, not verified working
code. More importantly: **building for iPhone requires Xcode, which only runs on
macOS.** There is no way to compile or install this on an iPhone from Linux/Windows,
or from this session. To see it on your iPhone 16, you'll need a Mac.

If you want to see *something* working on your iPhone right now with zero setup,
the web app already deployed to **https://tutor-camera-app.netlify.app** does
camera capture + OCR today, directly in Safari, no build tooling required. This
Flutter app is the native version with the fuller feature set (drawing, PDF export,
save to Photos).

## One-time setup (on a Mac)

1. Install Flutter: https://docs.flutter.dev/get-started/install/macos
   Then run `flutter doctor` and resolve anything it flags (Xcode, CocoaPods, etc.)
2. From the repo root:
   ```
   cd mobile
   flutter create .
   ```
   This only fills in the `ios/` and `android/` platform folders and other files
   this repo doesn't track (see `.gitignore`) — it will not touch `lib/` or
   `pubspec.yaml`.
3. `flutter pub get`
4. Add camera/photo-library usage descriptions (required or the app crashes
   immediately on device — iOS refuses to prompt for permission without these):

   **`ios/Runner/Info.plist`** — add inside the outer `<dict>`:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Used to capture the question you're tutoring.</string>
   <key>NSPhotoLibraryAddUsageDescription</key>
   <string>Used to save the annotated answer to your photo library.</string>
   ```

   **`android/app/src/main/AndroidManifest.xml`** — add inside the outer
   `<manifest>`, above `<application>`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera" android:required="true" />
   ```

5. Plug in the iPhone, trust the computer, then open `ios/Runner.xcworkspace` in
   Xcode once to set a signing Team under Runner > Signing & Capabilities (a free
   Apple ID works for local device installs; it just needs re-signing every 7 days).

## Run

```
flutter devices        # confirm the iPhone shows up
flutter run             # pick the iPhone if prompted
```

## What's implemented

- **Home** — list of past sessions this app run (in-memory only; resets on
  restart, no persistence/cloud sync yet), "New Session" button
- **Camera** — live preview, permission handling, capture + on-device OCR
  (`google_mlkit_text_recognition`)
- **Edit** — freehand pen (color + width), eraser (true transparency via an
  isolated paint layer + `BlendMode.clear`, not a color-matching hack), tap-to-place
  text, undo/redo
- **Share** — editable answer text, save to Photos (`gal`), system share sheet
  (`share_plus`), single-page PDF export (photo + question + answer)

## Known gaps / things worth doing next

- Sessions aren't persisted to disk or a database — closing the app loses history.
  Firebase (Firestore + Storage) was in the original spec but intentionally left
  out of this pass; revisit if cross-device history matters.
- The drawing canvas paints at the photo's full native resolution (e.g. ~12MP on
  an iPhone), which is correct for export quality but means every pointer-move
  frame while drawing repaints that whole canvas. Should be smooth on an iPhone 16;
  worth profiling if you later test on older/low-end Android hardware.
- No automated tests yet.
