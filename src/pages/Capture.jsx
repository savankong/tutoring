import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function answerRows(answer) {
  return Math.min(6, Math.max(2, Math.ceil(answer.length / 30)));
}

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
  const [explanation, setExplanation] = useState('');
  const [activeTab, setActiveTab] = useState('answer'); // answer, explanation
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, live, done

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Only one primary button exists on screen at a time; moving focus to it
  // on every state change means a keyboard, switch, or other assistive
  // input can drive the whole capture -> answer -> next-question loop by
  // repeatedly hitting Enter/Space, without needing to Tab to find it.
  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, [status]);

  // Real elapsed time, not a fake typing animation — we only get the full
  // answer once Claude's done, so "Thinking... Ns" / "Thought for Ns" is
  // the honest version of the streaming indicator this is modeled on.
  useEffect(() => {
    if (!ocrPending) return;
    setThinkingSeconds(0);
    const interval = setInterval(() => setThinkingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [ocrPending]);

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
    setExplanation('');
    setActiveTab('answer');
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
        setExplanation(data.explanation || '');
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
    setExplanation('');
    setActiveTab('answer');
    answerEditedRef.current = false;
    startCamera(); // stream was released after the last capture — reacquire it
  };

  return (
    <div className={`App${status === 'done' ? ' has-sticky-actions' : ''}`}>
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
          <div className="capture-tabs">
            <button
              type="button"
              className={`capture-tab${activeTab === 'answer' ? ' capture-tab-active' : ''}`}
              onClick={() => setActiveTab('answer')}
            >
              Answer
            </button>
            <button
              type="button"
              className={`capture-tab${activeTab === 'explanation' ? ' capture-tab-active' : ''}`}
              onClick={() => setActiveTab('explanation')}
            >
              Explanation
            </button>
          </div>

          <div className="thinking-indicator">
            {ocrPending ? (
              <>
                <span className="thinking-spinner" />
                <span>Thinking… {thinkingSeconds}s</span>
              </>
            ) : (
              !ocrError &&
              !upgradeReason && (
                <>
                  <span className="thinking-check">✓</span>
                  <span>Thought for {thinkingSeconds}s</span>
                </>
              )
            )}
          </div>

          {ocrError && <p className="error-text">{ocrError}</p>}
          {upgradeReason && (
            <p className="error-text">
              {upgradeReason === 'cap_reached'
                ? "You've used all your captures for this month."
                : 'Your free trial has ended.'}{' '}
              <Link to="/account">Upgrade to keep going</Link>
            </p>
          )}

          {activeTab === 'answer' ? (
            <div className="tab-content" key={`answer-${image}`}>
              <textarea
                className="answer-display"
                value={answer}
                onChange={(e) => {
                  answerEditedRef.current = true;
                  setAnswer(e.target.value);
                }}
                rows={answerRows(answer)}
                placeholder="The answer will appear here — edit as needed..."
              />
            </div>
          ) : (
            <div className="tab-content explanation-body" key={`explanation-${image}`}>
              {explanation || (ocrPending ? 'Working it out…' : 'No additional explanation for this one.')}
            </div>
          )}
        </div>
      )}

      {status === 'done' ? (
        <div className="sticky-actions">
          <div className="actions">
            <button ref={primaryButtonRef} className="pill-action-button" onClick={nextQuestion}>
              New Question
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          {status === 'idle' && (
            <button ref={primaryButtonRef} className="pill-action-button" onClick={startCamera}>
              Start Camera
            </button>
          )}
          {status === 'live' && (
            <button ref={primaryButtonRef} className="pill-action-button" onClick={captureAndAnalyze}>
              Capture
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Capture;
