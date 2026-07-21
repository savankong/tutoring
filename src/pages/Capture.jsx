import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function answerRows(answer) {
  return Math.min(6, Math.max(2, Math.ceil(answer.length / 30)));
}

// Portrait has no fixed ratio — the viewfinder just fills the available
// space, matching the original behavior. Square/landscape crop the native
// video frame to that exact ratio so the captured photo's dimensions match
// what's actually framed on screen, instead of always saving the full
// uncropped camera frame regardless of what the viewfinder shows.
const ASPECT_RATIOS = { portrait: null, square: 1, landscape: 4 / 3 };

function cropRectForAspect(video, ratio) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!ratio) return { sx: 0, sy: 0, sw: vw, sh: vh };
  const videoRatio = vw / vh;
  const sw = videoRatio > ratio ? vh * ratio : vw;
  const sh = videoRatio > ratio ? vh : vw / ratio;
  return { sx: (vw - sw) / 2, sy: (vh - sh) / 2, sw, sh };
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2l.9-1.5A2 2 0 0 1 11.13 3.5h1.74a2 2 0 0 1 1.73 1L16.5 6h1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="#1d1d1f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.4" stroke="#1d1d1f" strokeWidth="1.6" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="#fff" strokeWidth="1.6" />
      <circle cx="8.5" cy="9.5" r="1.6" stroke="#fff" strokeWidth="1.4" />
      <path
        d="M4 16.5l4.5-4.5a1.6 1.6 0 0 1 2.2 0l2.3 2.3M13 15l2.3-2.3a1.6 1.6 0 0 1 2.2 0L20.5 15.7"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Capture() {
  const { user, refresh } = useAuthContext();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const answerEditedRef = useRef(false);
  const requestIdRef = useRef(0);
  const primaryButtonRef = useRef(null);

  const [image, setImage] = useState(null);
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [whyOthersWrong, setWhyOthersWrong] = useState('');
  const [activeTab, setActiveTab] = useState('answer'); // answer, explanation
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, live, done
  const [aspect, setAspect] = useState('portrait'); // portrait, square, landscape

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

  const runAnalysis = (dataUrl, mediaType) => {
    const requestId = ++requestIdRef.current;

    setImage(dataUrl);
    setAnswer('');
    setExplanation('');
    setWhyOthersWrong('');
    setActiveTab('answer');
    setOcrError('');
    setUpgradeReason('');
    answerEditedRef.current = false;
    setStatus('done');

    // Teacher mode: don't block on the analysis call — the answer box is
    // usable immediately, and Claude's answer fills in whenever it's ready.
    setOcrPending(true);
    const base64 = dataUrl.split(',')[1];

    fetch('/.netlify/functions/analyze-question', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: base64, mediaType }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (requestIdRef.current !== requestId) return; // stale, tutor moved on
        if (res.status === 402) {
          setUpgradeReason('cap_reached');
          return;
        }
        if (!res.ok) throw new Error(data.error || 'Request failed');
        if (!answerEditedRef.current) setAnswer(data.answer || '');
        setExplanation(data.explanation || '');
        setWhyOthersWrong(data.why_others_wrong || '');
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

  const captureAndAnalyze = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const { sx, sy, sw, sh } = cropRectForAspect(video, ASPECT_RATIOS[aspect]);
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Release the camera once we have the frame we need — keeping it live
    // while a slow Claude request is in flight is a memory/CPU load iOS
    // Safari can react to by reloading the tab. It's reacquired on "New
    // Question" instead.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current.srcObject = null;

    runAnalysis(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;

    const reader = new FileReader();
    reader.onload = () => runAnalysis(reader.result, file.type || 'image/jpeg');
    reader.readAsDataURL(file);
  };

  const nextQuestion = () => {
    // Leave "done" first so the camera view (and its <video> element) is
    // mounted before startCamera's awaited getUserMedia call resumes and
    // tries to attach the stream — otherwise videoRef.current is still null.
    setStatus('idle');
    setImage(null);
    setOcrPending(false);
    setOcrError('');
    setUpgradeReason('');
    setAnswer('');
    setExplanation('');
    setWhyOthersWrong('');
    setActiveTab('answer');
    answerEditedRef.current = false;
    startCamera(); // stream was released after the last capture — reacquire it
  };

  return (
    <div className={`App${status === 'done' ? ' has-sticky-actions' : ' camera-mode'}`}>
      {status !== 'done' ? (
        <div className="camera-view">
          <div className="camera-topbar">
            <Logo size={24} />
            <div className="camera-topbar-links">
              <Link to="/history">History</Link>
              <Link to="/account">Account</Link>
              {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
            </div>
          </div>

          <p className="camera-instruction">
            {status === 'live' ? 'Frame the question. Hold steady.' : 'Start your camera to scan a question.'}
          </p>

          <div className="aspect-toggle" role="group" aria-label="Capture dimensions">
            {Object.keys(ASPECT_RATIOS).map((key) => (
              <button
                key={key}
                type="button"
                className={`aspect-toggle-btn${aspect === key ? ' aspect-toggle-btn-active' : ''}`}
                onClick={() => setAspect(key)}
              >
                {key === 'portrait' ? 'Portrait' : key === 'square' ? 'Square' : 'Landscape'}
              </button>
            ))}
          </div>

          <div className={`camera-viewfinder camera-viewfinder-${aspect}`}>
            <video ref={videoRef} playsInline muted />
            <div className="media-frame-corner media-frame-corner-tl" />
            <div className="media-frame-corner media-frame-corner-tr" />
            <div className="media-frame-corner media-frame-corner-bl" />
            <div className="media-frame-corner media-frame-corner-br" />
          </div>

          <div className="camera-controls">
            <button
              type="button"
              className="camera-icon-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload a photo"
            >
              <GalleryIcon />
            </button>
            <button
              type="button"
              ref={primaryButtonRef}
              className="camera-shutter-button"
              onClick={status === 'idle' ? startCamera : captureAndAnalyze}
              aria-label={status === 'idle' ? 'Start camera' : 'Capture'}
            >
              <CameraIcon />
            </button>
            <span className="camera-icon-spacer" aria-hidden="true" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      ) : (
        <>
          <div className="top-nav">
            <span className="top-nav-email">{user?.email}</span>
            <Link to="/history">History</Link>
            <Link to="/account">Account</Link>
            {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          </div>

          <h1>
            <Logo size={26} wordmark />
          </h1>

          <div className="media-frame media-frame-compact">
            <img src={image} alt="Captured question" />
            <div className="media-frame-corner media-frame-corner-tl" />
            <div className="media-frame-corner media-frame-corner-tr" />
            <div className="media-frame-corner media-frame-corner-bl" />
            <div className="media-frame-corner media-frame-corner-br" />
          </div>

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
                You've used all your captures for this month. <Link to="/account">Upgrade to keep going</Link>
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
                {explanation ? (
                  <>
                    <div className="explanation-section">
                      <div className="explanation-section-title">Why "{answer}" is correct</div>
                      <p>{explanation}</p>
                    </div>
                    {whyOthersWrong && (
                      <div className="explanation-section">
                        <div className="explanation-section-title">Why the other answers aren't correct</div>
                        <p>{whyOthersWrong}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p>{ocrPending ? 'Working it out…' : 'No additional explanation for this one.'}</p>
                )}
              </div>
            )}
          </div>

          <div className="sticky-actions">
            <div className="actions">
              <button ref={primaryButtonRef} className="pill-action-button" onClick={nextQuestion}>
                New Question
              </button>
            </div>
          </div>
        </>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Capture;
