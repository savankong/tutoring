import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle, ocr, done
  const [ocrProgress, setOcrProgress] = useState(0);

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

  const captureAndOCR = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');

    setImage(dataUrl);
    setStatus('ocr');
    setOcrProgress(0);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCameraReady(false);

    Tesseract.recognize(dataUrl, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.round(m.progress * 100));
        }
      },
    })
      .then(({ data: { text } }) => {
        setOcrText(text.trim());
        setStatus('done');
      })
      .catch(() => {
        alert('OCR failed. Please try again.');
        setStatus('idle');
      });
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
    setAnswer('');
    setStatus('idle');
    setOcrProgress(0);
  };

  return (
    <div className="App">
      <h1>📸 Tutor Camera App</h1>

      {status === 'idle' && (
        <div>
          <video ref={videoRef} playsInline muted style={{ width: '100%', maxWidth: 500 }} />
          <br />
          <button onClick={startCamera}>📷 Start Camera</button>
          <button onClick={captureAndOCR} disabled={!cameraReady}>
            📸 Capture & OCR
          </button>
        </div>
      )}

      {status === 'ocr' && <p>Running OCR... {ocrProgress}%</p>}

      {status === 'done' && (
        <div>
          <img src={image} alt="Captured question" style={{ width: '100%', maxWidth: 500 }} />
          <h3>Extracted Question:</h3>
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={5}
            style={{ width: '100%', maxWidth: 500 }}
          />
          <h3>Your Answer:</h3>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Type your answer here..."
            style={{ width: '100%', maxWidth: 500 }}
          />
          <br />
          <button onClick={shareResult}>📤 Share Answer (as image)</button>
          <button onClick={reset}>🔄 New Question</button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
