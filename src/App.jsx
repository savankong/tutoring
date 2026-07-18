import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const answerEditedRef = useRef(false);
  const requestIdRef = useRef(0);

  const [image, setImage] = useState(null);
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle, live, done

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
      setStatus('live');
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

    const requestId = ++requestIdRef.current;

    setImage(dataUrl);
    setAnswer('');
    setOcrError('');
    answerEditedRef.current = false;
    setStatus('done');

    // Teacher mode: don't block on the analysis call — the answer box is
    // usable immediately, and Claude's answer fills in whenever it's ready.
    // The camera stream stays live in the background so "New Question" can
    // jump straight back to capturing, no re-prompt needed.
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
        // Ignore stale responses from a question the tutor already moved past.
        if (requestIdRef.current !== requestId) return;
        if (!answerEditedRef.current) setAnswer(data.answer || '');
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setOcrError(err.message || 'Could not analyze the photo.');
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setOcrPending(false);
      });
  };

  const nextQuestion = () => {
    setImage(null);
    setOcrPending(false);
    setOcrError('');
    setAnswer('');
    answerEditedRef.current = false;
    setStatus('live');
  };

  return (
    <div className="App">
      <h1>📸 Tutor Camera App</h1>

      {status !== 'done' && (
        <div className="media-frame">
          <video ref={videoRef} playsInline muted />
        </div>
      )}

      {status === 'done' && (
        <div className="media-frame media-frame-compact">
          <img src={image} alt="Captured question" />
        </div>
      )}

      {status === 'done' && (
        <div>
          <h3>Answer {ocrPending && <span className="pending-tag">asking Claude…</span>}</h3>
          {ocrError && <p className="error-text">{ocrError}</p>}
          <textarea
            value={answer}
            onChange={(e) => {
              answerEditedRef.current = true;
              setAnswer(e.target.value);
            }}
            rows={8}
            placeholder="Claude's answer will appear here — edit as needed..."
            autoFocus
          />
        </div>
      )}

      <div className="actions">
        {status === 'idle' && <button onClick={startCamera}>📷 Start Camera</button>}
        {status === 'live' && <button onClick={captureAndAnalyze}>📸 Capture</button>}
        {status === 'done' && (
          <button className="secondary" onClick={nextQuestion}>
            🔄 New Question
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
