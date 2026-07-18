import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const answerEditedRef = useRef(false);
  const requestIdRef = useRef(0);
  const primaryButtonRef = useRef(null);

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

  // Only one button exists on screen at a time; moving focus to it on every
  // state change means a keyboard, switch, or other assistive input can
  // drive the whole capture -> answer -> next-question loop by repeatedly
  // hitting Enter/Space, without needing to Tab to find the next control.
  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, [status]);

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

      <div className={`media-frame${status === 'done' ? ' media-frame-compact' : ''}`}>
        {/* Always mounted so its srcObject/playback survives "New Question" —
            iOS Safari drops a hidden or unmounted <video>'s live stream and
            won't resume it just by making the element visible again. The
            captured photo is layered on top instead of swapping video out. */}
        <video ref={videoRef} playsInline muted />
        {status === 'done' && <img src={image} alt="Captured question" />}
      </div>

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
          />
        </div>
      )}

      <div className="actions">
        {status === 'idle' && (
          <button ref={primaryButtonRef} onClick={startCamera}>
            📷 Start Camera
          </button>
        )}
        {status === 'live' && (
          <button ref={primaryButtonRef} onClick={captureAndAnalyze}>
            📸 Capture
          </button>
        )}
        {status === 'done' && (
          <button ref={primaryButtonRef} className="secondary" onClick={nextQuestion}>
            🔄 New Question
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;
