import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import PhoneMockup from '../components/PhoneMockup.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Seo from '../components/Seo.jsx';
import ResourcesFooter from '../components/ResourcesFooter.jsx';
import { submitForm } from '../lib/submitForm.js';

const NAV_ITEMS = [
  { label: 'How it works', href: '#how' },
  { label: 'Why tutors', href: '#why' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Resources', href: '#resources' },
];

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
    icon: 'zap',
  },
  {
    title: 'Works on any phone',
    body: 'iPhone or Android, new or old — if it has a camera, Cambo runs right in the browser. No app store, no install.',
    icon: 'phone',
  },
  {
    title: 'Less fumbling, more teaching',
    body: 'One big shutter button and nothing else to hunt for, so you spend less time tapping around and more time with your student.',
    icon: 'target',
  },
  {
    title: 'Hands-free capture',
    body: 'Pair a Bluetooth keyboard and trigger Capture without touching the screen, so you can stay focused on your student.',
    icon: 'keyboard',
  },
  {
    title: 'Pays for itself fast',
    body: "If it saves you 20 minutes across a month, it's already worth more than the subscription.",
    icon: 'dollar',
  },
];

const WHY_ICON_PATHS = {
  zap: (
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  ),
  phone: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" />
      <line x1="10" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="14" y2="10" />
      <line x1="18" y1="10" x2="18" y2="10" />
      <line x1="6" y1="14" x2="14" y2="14" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
};

function WhyIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {WHY_ICON_PATHS[name]}
    </svg>
  );
}

const FAQS = [
  {
    q: 'What subjects does it cover?',
    a: 'Any standardized test you can photograph — SAT, ACT, state assessments, entrance exams, professional certification tests, and more. Answer quality is strongest for structured problems with a clear question.',
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

const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cambo App',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (web-based)',
  url: 'https://camboapp.com/',
  description: 'Point your phone at any practice question and get the answer in seconds. Built for live tutoring sessions.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

function Landing() {
  const { user, loading } = useAuthContext();

  const [screenIndex, setScreenIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [faqOpen, setFaqOpen] = useState([true, false, false]);
  const [askName, setAskName] = useState('');
  const [askEmail, setAskEmail] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askError, setAskError] = useState('');
  const [askSubmitting, setAskSubmitting] = useState(false);
  const [askSent, setAskSent] = useState(false);

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

  const submitAskForm = async (e) => {
    e.preventDefault();
    setAskError('');
    setAskSubmitting(true);
    try {
      await submitForm('question', { name: askName, email: askEmail, question: askQuestion });
      setAskSent(true);
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAskSubmitting(false);
    }
  };

  const screen = DEMO_QUESTIONS[screenIndex];

  return (
    <div className="landing">
      <Seo
        title="Cambo App — Snap a Photo, Get the Answer | Camera App for Tutors"
        description="Point your phone at any practice question and get the answer in seconds. Built for live tutoring sessions — no app install, works on any phone."
        path="/"
      >
        <script type="application/ld+json">{JSON.stringify(SOFTWARE_APP_SCHEMA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Seo>
      <Sidebar navItems={NAV_ITEMS} user={user} />

      <div className="mkt-main">
      <section className="hero-section">
        <div className="hero-shape hero-shape-fill" />
        <div className="hero-shape hero-shape-outline" />
        <div className="hero-copy">
          <h1>The answer key in your pocket. Point, tap, keep moving.</h1>
          <p>
            Point your phone at any practice question. Get the answer in seconds. Stay in the room
            with your student instead of working the problem out yourself.
          </p>
          <div className="hero-cta-row" id="start">
            <Link to="/register" className="pill-button pill-button-lg">
              Get started free
            </Link>
            <span className="hero-microcopy">Free forever · no card required</span>
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
                <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-title">{step.title}</div>
                <div className="step-body">{step.body}</div>
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
                  <div className="phone-question-label">{screen.label}</div>
                  <div className="phone-question-text">{screen.question}</div>
                </div>
                <div className="phone-answer-box">
                  <strong>Answer</strong> — {screen.answer}
                </div>
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
            {REASONS.map((reason, i) => (
              <div className="why-card" key={reason.title}>
                <div className={`why-icon-badge${i % 2 === 1 ? ' why-icon-badge-alt' : ''}`}>
                  <WhyIcon name={reason.icon} />
                </div>
                <div className="why-card-title">{reason.title}</div>
                <div className="why-card-body">{reason.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-eyebrow">Pricing</div>
        <h2>Start using it for free today — no credit card needed.</h2>
        <div className="pricing-card">
          <div className="pricing-card-glow" />
          <div className="pricing-amount-row">
            <span className="pricing-amount">$0</span>
            <span className="pricing-period">to start</span>
          </div>
          <div className="pricing-sub">Free forever, no card required — upgrade whenever you outgrow it</div>
          <div className="pricing-features">
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              Free tier: 5 captures a month
            </div>
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              Paid plans from $9/month for daily tutoring use
            </div>
            <div className="pricing-feature">
              <span className="pricing-feature-check">✓</span>
              Cancel anytime, no contract
            </div>
          </div>
          <Link to="/pricing" className="pill-button pill-button-lg">
            See full pricing
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
              <div className="faq-answer" hidden={!faqOpen[i]}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="ask" className="ask-section">
        <div className="section-eyebrow">Ask a question</div>
        <h2>Have a question? Send us a message.</h2>
        <div className="auth-card ask-card">
          {askSent ? (
            <p className="auth-subhead">Thanks — we'll get back to you at {askEmail}.</p>
          ) : (
            <form onSubmit={submitAskForm} className="auth-form">
              <label>
                <span className="auth-label">Name</span>
                <input
                  type="text"
                  value={askName}
                  onChange={(e) => setAskName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                <span className="auth-label">Email</span>
                <input
                  type="email"
                  value={askEmail}
                  onChange={(e) => setAskEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                <span className="auth-label">Question</span>
                <textarea value={askQuestion} onChange={(e) => setAskQuestion(e.target.value)} required rows={4} />
              </label>
              {askError && <p className="error-text">{askError}</p>}
              <button type="submit" disabled={askSubmitting}>
                {askSubmitting ? 'Sending…' : 'Send question'}
              </button>
            </form>
          )}
        </div>
      </section>

      <ResourcesFooter />

      <section className="footer-cta-section">
        <div className="footer-cta-shape footer-cta-shape-fill" />
        <div className="footer-cta-shape footer-cta-shape-outline" />
        <h2>Stop losing the moment mid-session.</h2>
        <Link to="/register" className="pill-button pill-button-lg">
          Get started free
        </Link>
        <div className="footer-bottom">
          <div>© 2026 Cambo App</div>
          <div className="footer-links">
            <a href="#how">How it works</a>
            <Link to="/pricing">Pricing</Link>
            <a href="#faq">FAQ</a>
            <a href="#resources">Resources</a>
            <a href="#ask">Ask a question</a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

export default Landing;
