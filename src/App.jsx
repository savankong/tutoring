import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const questionEditedRef = useRef(false);
  const answerEditedRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState('');
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

  const captureAndAnalyze = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setImage(dataUrl);
    setOcrText('');
    setAnswer('');
    setOcrError('');
    questionEditedRef.current = false;
    answerEditedRef.current = false;
    setStatus('done');
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCameraReady(false);

    // Teacher mode: don't block on the analysis call — the answer box is
    // usable immediately, and Claude's question/answer fill in whenever
    // they're ready.
    setOcrPending(true);
    const base64 = dataUrl.split(',')[1];

    fetch('/.netlify/functions/analyze-question', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        if (!questionEditedRef.current) setOcrText(data.question || '');
        if (!answerEditedRef.current) setAnswer(data.answer || '');
      })
      .catch((err) => {
        setOcrError(err.message || 'Could not analyze the photo.');
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
    setOcrError('');
    setAnswer('');
    questionEditedRef.current = false;
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
            <button onClick={captureAndAnalyze} disabled={!cameraReady}>
              📸 Capture & Analyze
            </button>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div>
          <div className="media-frame media-frame-compact">
            <img src={image} alt="Captured question" />
          </div>
          <h3>Question {ocrPending && <span className="pending-tag">asking Claude…</span>}</h3>
          <textarea
            value={ocrText}
            onChange={(e) => {
              questionEditedRef.current = true;
              setOcrText(e.target.value);
            }}
            rows={3}
            placeholder={ocrPending ? '' : '(no question detected — edit or type it in)'}
          />
          {ocrError && <p className="error-text">{ocrError}</p>}
          <h3>Answer</h3>
          <textarea
            value={answer}
            onChange={(e) => {
              answerEditedRef.current = true;
              setAnswer(e.target.value);
            }}
            rows={5}
            placeholder="Claude's answer will appear here — edit as needed..."
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
