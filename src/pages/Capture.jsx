import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function Capture() {
  const { user, refresh } = useAuthContext();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const answerEditedRef = useRef(false);
  const requestIdRef = useRef(0);
  const primaryButtonRef = useRef(null);

  const [image, setImage] = useState(null);
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');
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
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus('live');
    } catch {
      alert('Camera access denied or not available.');
      setStatus('idle');
    }
  };

  const captureAndAnalyze = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Release the camera once we have the frame we need — keeping it live
    // while a slow Claude request is in flight is a memory/CPU load iOS
    // Safari can react to by reloading the tab. It's reacquired on "New
    // Question" instead.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current.srcObject = null;

    const requestId = ++requestIdRef.current;

    setImage(dataUrl);
    setAnswer('');
    setOcrError('');
    setUpgradeReason('');
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
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (requestIdRef.current !== requestId) return; // stale, tutor moved on
        if (res.status === 402) {
          setUpgradeReason(data.reason === 'cap_reached' ? 'cap_reached' : 'trial_expired');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Request failed');
        if (!answerEditedRef.current) setAnswer(data.answer || '');
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setOcrError(err.message || 'Could not analyze the photo.');
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setOcrPending(false);
          refresh(); // keep the trial/usage numbers on /account current
        }
      });
  };

  const nextQuestion = () => {
    setImage(null);
    setOcrPending(false);
    setOcrError('');
    setUpgradeReason('');
    setAnswer('');
    answerEditedRef.current = false;
    startCamera(); // stream was released after the last capture — reacquire it
  };

  return (
    <div className="App">
      <div className="top-nav">
        <span className="top-nav-email">{user?.email}</span>
        <Link to="/history">History</Link>
        <Link to="/account">Account</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      </div>

      <h1>
        <Logo size={26} wordmark />
      </h1>

      <div className={`media-frame${status === 'done' ? ' media-frame-compact' : ''}`}>
        {/* Always mounted so its srcObject/playback survives "New Question" —
            iOS Safari drops a hidden or unmounted <video>'s live stream and
            won't resume it just by making the element visible again. The
            captured photo is layered on top instead of swapping video out. */}
        <video ref={videoRef} playsInline muted />
        {status === 'done' && <img src={image} alt="Captured question" />}
        <div className="media-frame-corner media-frame-corner-tl" />
        <div className="media-frame-corner media-frame-corner-tr" />
        <div className="media-frame-corner media-frame-corner-bl" />
        <div className="media-frame-corner media-frame-corner-br" />
      </div>

      {status === 'done' && (
        <div>
          <h3>Answer {ocrPending && <span className="pending-tag">thinking…</span>}</h3>
          {ocrError && <p className="error-text">{ocrError}</p>}
          {upgradeReason && (
            <p className="error-text">
              {upgradeReason === 'cap_reached'
                ? "You've used all your captures for this month."
                : 'Your free trial has ended.'}{' '}
              <Link to="/account">Upgrade to keep going</Link>
            </p>
          )}
          <textarea
            value={answer}
            onChange={(e) => {
              answerEditedRef.current = true;
              setAnswer(e.target.value);
            }}
            rows={8}
            placeholder="The answer will appear here — edit as needed..."
          />
        </div>
      )}

      <div className="actions">
        {status === 'idle' && (
          <button ref={primaryButtonRef} className="pill-action-button" onClick={startCamera}>
            Start Camera
          </button>
        )}
        {status === 'live' && (
          <button
            ref={primaryButtonRef}
            className="shutter-button"
            onClick={captureAndAnalyze}
            aria-label="Capture"
          >
            <span className="shutter-button-dot" />
          </button>
        )}
        {status === 'done' && (
          <button ref={primaryButtonRef} className="pill-action-button" onClick={nextQuestion}>
            New Question
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Capture;
