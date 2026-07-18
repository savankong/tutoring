import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const answerEditedRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrPending, setOcrPending] = useState(false);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle, done

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    } catch {
      alert('Camera access denied or not available.');
    }
  };

  // Question pages have browser chrome / breadcrumbs above the actual
  // question ("View History Bookmarks... boostprep.com/courses/..."). Cut
  // everything before the "N. Question" heading so only the question
  // (and its answer choices) survive.
  const trimToQuestionMarker = (text) => {
    const lines = text.split('\n');
    const startIndex = lines.findIndex((line) => /^\s*\d+\s*\.\s*question\b/i.test(line));
    return (startIndex === -1 ? lines : lines.slice(startIndex)).join('\n').trim();
  };

  // Pull out lines that look like multiple-choice options ("A. 16 flight/month")
  // so the answer field can default to just the choices, not the question body.
  const extractAnswerChoices = (text) => {
    return text
      .split('\n')
      .map((line) => line.match(/^\s*([A-Ea-e])[.)]\s+(.+)$/))
      .filter(Boolean)
      .map((match) => `${match[1].toUpperCase()}. ${match[2].trim()}`)
      .join('\n');
  };

  const captureAndOCR = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');

    setImage(dataUrl);
    setOcrText('');
    setAnswer('');
    answerEditedRef.current = false;
    setStatus('done');
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCameraReady(false);

    // Teacher mode: don't block on OCR — the answer box is usable
    // immediately, and the extracted text fills in whenever it's ready
    // (screen photos are often too glare-y/skewed for reliable OCR).
    setOcrPending(true);
    Tesseract.recognize(dataUrl, 'eng')
      .then(({ data: { text } }) => {
        const trimmed = trimToQuestionMarker(text);
        setOcrText(trimmed);
        if (!answerEditedRef.current) {
          const choices = extractAnswerChoices(trimmed);
          if (choices) setAnswer(choices);
        }
      })
      .catch(() => {
        setOcrText('');
      })
      .finally(() => setOcrPending(false));
  };

  const wrapText = (text, maxChars) => {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChars) {
        lines.push(current.trim());
        current = word;
      } else {
        current += ' ' + word;
      }
    }
    if (current.trim()) lines.push(current.trim());
    return lines;
  };

  const shareResult = () => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const padding = 20;
      const lineHeight = 26;
      const answerLines = wrapText(`Answer: ${answer || '(no answer)'}`, 60);
      const footerHeight = padding * 2 + answerLines.length * lineHeight;

      canvas.width = img.width;
      canvas.height = img.height + footerHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, img.height, canvas.width, footerHeight);
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      answerLines.forEach((line, i) => {
        ctx.fillText(line, padding, img.height + padding + (i + 1) * lineHeight - 8);
      });

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'tutor_answer.jpg', { type: 'image/jpeg' });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Tutor Answer' });
            return;
          } catch (err) {
            if (err?.name === 'AbortError') return;
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tutor_answer.jpg';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg');
    };
    img.src = image;
  };

  const reset = () => {
    setImage(null);
    setOcrText('');
    setOcrPending(false);
    setAnswer('');
    answerEditedRef.current = false;
    setStatus('idle');
  };

  return (
    <div className="App">
      <h1>📸 Tutor Camera App</h1>

      {status === 'idle' && (
        <div>
          <div className="media-frame">
            <video ref={videoRef} playsInline muted />
          </div>
          <div className="actions">
            <button className="secondary" onClick={startCamera}>
              📷 Start Camera
            </button>
            <button onClick={captureAndOCR} disabled={!cameraReady}>
              📸 Capture & OCR
            </button>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          <div className="media-frame media-frame-compact">
            <img src={image} alt="Captured question" />
          </div>
          <h3>Extracted Question {ocrPending && <span className="pending-tag">reading…</span>}</h3>
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={3}
            placeholder={ocrPending ? '' : '(no text found — edit or type it in)'}
          />
          <h3>Your Answer</h3>
          <textarea
            value={answer}
            onChange={(e) => {
              answerEditedRef.current = true;
              setAnswer(e.target.value);
            }}
            rows={4}
            placeholder="Type your answer here..."
            autoFocus
          />
          <div className="actions">
            <button onClick={shareResult}>📤 Share Answer</button>
            <button className="secondary" onClick={reset}>
              🔄 New Question
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
