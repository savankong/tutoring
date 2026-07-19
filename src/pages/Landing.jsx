import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import PhoneMockup from '../components/PhoneMockup.jsx';
import Logo from '../components/Logo.jsx';

const DEMO_QUESTIONS = [
  {
    label: 'VERBAL',
    question:
      'All project managers at the firm are PMP-certified. Lexi is a project manager at the firm. Which conclusion follows?',
    options: [
      { letter: 'A', text: 'Lexi is PMP-certified.' },
      { letter: 'B', text: 'Lexi is not PMP-certified.' },
      { letter: 'C', text: 'Lexi manages a team.' },
      { letter: 'D', text: 'Cannot be determined.' },
    ],
    answer: 'A — this follows the logical rule of syllogism: all PMs are certified, Lexi is a PM, so Lexi is certified.',
  },
  {
    label: 'VERBAL',
    question: 'Choose the word that means most nearly the same as "AMBIVALENT."',
    options: [
      { letter: 'A', text: 'uncertain' },
      { letter: 'B', text: 'confident' },
      { letter: 'C', text: 'eager' },
      { letter: 'D', text: 'hostile' },
    ],
    answer: 'A — ambivalent means having mixed or uncertain feelings about something.',
  },
  {
    label: 'MATH',
    question: 'In a classroom, the ratio of boys to girls is 5:4. If there are 20 boys, how many girls are in the classroom?',
    options: [
      { letter: 'A', text: '12' },
      { letter: 'B', text: '14' },
      { letter: 'C', text: '16' },
      { letter: 'D', text: '18' },
      { letter: 'E', text: '20' },
    ],
    answer: 'C — 20 boys ÷ 5 × 4 = 16 girls.',
  },
];

const STEPS = [
  { title: 'Open the app', body: 'Right from your home screen, no app store needed.' },
  { title: 'Point the camera', body: 'Aim at the question on the page or screen.' },
  { title: 'Tap Capture', body: 'The answer comes back in a few seconds.' },
  { title: 'Keep teaching', body: 'No fumbling for a calculator, no losing your place mid-session.' },
];

const REASONS = [
  {
    title: 'Built for speed',
    body: "No fluff, no extra screens — just capture and answer. Nothing you don't need in the middle of a session.",
  },
  {
    title: 'Hands-free capture',
    body: 'Pair a Bluetooth keyboard and trigger Capture without touching the screen, so you can stay focused on your student.',
  },
  {
    title: 'Pays for itself fast',
    body: "If it saves you 20 minutes across a month, it's already worth more than the subscription.",
  },
];

const FAQS = [
  {
    q: 'Is this for students?',
    a: "It's built for tutors running live sessions, not for students doing homework alone. Session history and review features are designed around how tutors work with a student in the room.",
  },
  {
    q: 'What subjects does it cover?',
    a: 'Anything you can photograph: math, science, reading comprehension, test prep. Answer quality is strongest for structured problems with a clear question.',
  },
  {
    q: 'Do I need an account for each device?',
    a: 'No, one login works across your phone and any other device you add.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, through the account portal, no email required, no retention flow.',
  },
];

function Landing() {
  const { user, loading } = useAuthContext();

  const [screenIndex, setScreenIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [faqOpen, setFaqOpen] = useState([true, true, false, false]);

  if (!loading && user) return <Navigate to="/app" replace />;

  const stepScreen = (dir) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreenIndex((i) => (i + dir + DEMO_QUESTIONS.length) % DEMO_QUESTIONS.length);
      setTransitioning(false);
    }, 150);
  };

  const goToScreen = (i) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreenIndex(i);
      setTransitioning(false);
    }, 150);
  };

  const toggleFaq = (i) => {
    setFaqOpen((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const screen = DEMO_QUESTIONS[screenIndex];

  return (
    <div className="landing">
      <nav className="site-nav">
        <div className="site-nav-logo">
          <Logo size={20} wordmark />
        </div>
        <div className="site-nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why tutors</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link to="/register" className="pill-button pill-button-sm">
            Start free trial
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="landing-eyebrow">Built for live tutoring sessions</div>
          <h1>The answer key in your pocket. Point, tap, keep teaching.</h1>
          <p>
            Point your phone at any practice question. Get the answer in seconds. Stay in the room
            with your student instead of working the problem out yourself.
          </p>
          <div className="hero-cta-row" id="start">
            <Link to="/register" className="pill-button pill-button-lg">
              Start your free trial
            </Link>
            <span className="hero-microcopy">7 days free · no card required</span>
          </div>
        </div>

        <div className="mockup-col">
          <div className="mockup-glow" />
          <PhoneMockup
            activeIndex={screenIndex}
            count={DEMO_QUESTIONS.length}
            onPrev={() => stepScreen(-1)}
            onNext={() => stepScreen(1)}
            onGoTo={goToScreen}
          >
            <div className={`phone-screen${transitioning ? ' phone-fade-out' : ''}`}>
              <div className="media-frame-corner media-frame-corner-tl" />
              <div className="media-frame-corner media-frame-corner-tr" />
              <div className="media-frame-corner media-frame-corner-bl" />
              <div className="media-frame-corner media-frame-corner-br" />
              <div className="phone-question-box">
                <div className="phone-live-row">
                  <div className="phone-live-dot" />
                  <div className="phone-question-label">{screen.label}</div>
                </div>
                <div className="phone-question-text">{screen.question}</div>
                <div className="phone-options">
                  {screen.options.map((opt) => (
                    <div className="phone-option-row" key={opt.letter}>
                      <div className="phone-option-letter">{opt.letter}</div>
                      <div className="phone-option-text">{opt.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="phone-shutter-row">
              <div className="phone-shutter-ring">
                <div className="phone-shutter-dot" />
              </div>
            </div>
          </PhoneMockup>
        </div>
      </section>

      <section id="how" className="how-section">
        <div>
          <div className="section-eyebrow">How it works</div>
          <h2>Four seconds, not four minutes.</h2>
          <div className="steps-list">
            {STEPS.map((step, i) => (
              <div className="step-row" key={step.title}>
                <div className="step-num">{i + 1}</div>
                <div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-body">{step.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mockup-col">
          <PhoneMockup
            activeIndex={screenIndex}
            count={DEMO_QUESTIONS.length}
            onPrev={() => stepScreen(-1)}
            onNext={() => stepScreen(1)}
            onGoTo={goToScreen}
            headerRight={
              <button type="button" className="phone-history-toggle" onClick={() => setShowHistory((v) => !v)}>
                {showHistory ? 'Back' : 'History'}
              </button>
            }
          >
            {showHistory ? (
              <div className="phone-history-list">
                {DEMO_QUESTIONS.map((q, i) => (
                  <div
                    className="phone-history-item"
                    key={q.question}
                    onClick={() => {
                      goToScreen(i);
                      setShowHistory(false);
                    }}
                  >
                    <div className="phone-history-item-label">{q.label}</div>
                    <div className="phone-history-item-question">{q.question}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`phone-main-view${transitioning ? ' phone-fade-out' : ''}`}>
                <div className="phone-answer-card">
                  <div className="phone-question-label" style={{ color: 'rgba(29,29,31,0.4)', marginBottom: 6 }}>
                    {screen.label}
                  </div>
                  <div className="phone-question-text" style={{ color: '#1d1d1f' }}>
                    {screen.question}
                  </div>
                </div>
                <div className="phone-answer-heading">Answer</div>
                <div className="phone-answer-body">{screen.answer}</div>
              </div>
            )}
            <div className="phone-scan-btn">Scan Another Question</div>
          </PhoneMockup>
        </div>
      </section>

      <section id="why" className="why-section">
        <div className="why-inner">
          <div className="section-eyebrow">Why tutors use it</div>
          <h2>Built around the session, not around the app.</h2>
          <div className="why-grid">
            {REASONS.map((reason) => (
              <div className="why-card" key={reason.title}>
                <div className="why-card-title">{reason.title}</div>
                <div className="why-card-body">{reason.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-eyebrow">Pricing</div>
        <h2>Simple, and it pays for itself fast.</h2>
        <div className="pricing-card">
          <div className="pricing-amount-row">
            <span className="pricing-amount">$15</span>
            <span className="pricing-period">/ month</span>
          </div>
          <div className="pricing-sub">Cancel anytime, no contract</div>
          <div className="pricing-features">
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              200 captures a month — plenty for daily tutoring use
            </div>
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              Free 7-day trial, no card required
            </div>
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              One login across your phone and any other device
            </div>
          </div>
          <Link to="/register" className="pill-button pill-button-lg">
            Start your free trial
          </Link>
        </div>
      </section>

      <section id="faq" className="faq-section">
        <div className="section-eyebrow">FAQ</div>
        <h2>Questions, answered.</h2>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div className="faq-item" key={faq.q}>
              <button type="button" className="faq-question-row" onClick={() => toggleFaq(i)}>
                <span className="faq-question-text">{faq.q}</span>
                <span className={`faq-toggle-icon${faqOpen[i] ? ' faq-toggle-icon-open' : ''}`}>+</span>
              </button>
              {faqOpen[i] && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="footer-cta-section">
        <h2>Stop losing the moment mid-session.</h2>
        <Link to="/register" className="pill-button pill-button-lg">
          Start your free trial
        </Link>
        <div className="footer-bottom">
          <div>© 2026 Cambo App</div>
          <div className="footer-links">
            <a href="#how">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
