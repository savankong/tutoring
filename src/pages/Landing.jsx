import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Seo from '../components/Seo.jsx';
import ZineHeader from '../components/zine/ZineHeader.jsx';
import ZineResources from '../components/zine/ZineResources.jsx';
import ZineFonts from '../components/zine/ZineFonts.jsx';
import { ZineUnderline, ZineCircleThin, ZineCircleWord, ZineTornBorder, ZineArrow } from '../components/zine/ZineArt.jsx';
import '../styles/zine.css';

const TICKER_ITEMS = ['Snap the question', 'Get the answer', 'Stay in the room', 'Works on any phone', 'No app store'];

const STEPS = [
  { title: 'Open it', body: 'Straight off your home screen. No app store, no 400MB download, no permissions interrogation.' },
  { title: 'Point the camera', body: "At paper, at a screen, at a projector across the room. It doesn't care." },
  { title: 'Hit the shutter', body: 'One button, thumb-sized, impossible to miss. The answer beats your coffee to the table.' },
];

const QUESTIONS = [
  {
    category: 'Verbal',
    prompt: 'Choose the word that means most nearly the same as "AMBIVALENT."',
    options: ['uncertain', 'confident', 'eager', 'hostile'],
    answer: 0,
    rationale: 'Ambivalent means holding two opposing feelings at once — undecided. Uncertain is the only option in that neighbourhood.',
  },
  {
    category: 'Logic',
    prompt: 'All project managers at the firm are PMP-certified. Lexi is a project manager at the firm. Which conclusion follows?',
    options: ['Lexi is PMP-certified.', 'Lexi is not PMP-certified.', 'Lexi manages a team.', 'Cannot be determined.'],
    answer: 0,
    rationale: 'Textbook syllogism. Every PM is certified, Lexi is a PM, so Lexi is certified. The rest are traps.',
  },
  {
    category: 'Compliance',
    prompt: 'An email from "IT Support" asks you to confirm your password through a link. What should you do?',
    options: ['Click the link and confirm', 'Reply with the password', 'Report it as phishing', 'Forward it to your team'],
    answer: 2,
    rationale: 'The one you already knew before the module started. Nobody legitimate asks for a password over email.',
  },
];
const LETTERS = ['A', 'B', 'C', 'D'];

const WHY_CARDS = [
  { title: 'Fast or nothing', body: 'Capture, answer, done. There is no onboarding tour, no dashboard, no streak to maintain.' },
  { title: 'Any phone, any age', body: 'iPhone, Android, the cracked one in the drawer. If it has a camera and a browser, it runs.' },
  { title: 'Hands free', body: 'Pair a Bluetooth keyboard and fire the shutter without touching the screen at all.' },
];

const WHO_CARDS = [
  {
    kicker: 'The requirement',
    title: 'Forestry 101 at 8am',
    body: (
      <>
        You needed three credits. The catalog offered soil science, cloud formations and underwater basket weaving. You are not
        going to be a forester. You are going to pass.
      </>
    ),
  },
  {
    kicker: 'The annual ritual',
    title: 'Compliance week, again',
    body: 'Same twelve modules, same clip-art phishing email, same quiz you passed last October. It exists so a box gets checked. Check it in four minutes and get back to work.',
  },
  {
    kicker: 'The gatekeeper',
    title: 'The test between you and the job',
    body: "You've done the work for eleven years. A multiple-choice form still wants proof. Fine — give it the proof and move on.",
  },
];

const FAQS = [
  {
    q: 'What can it actually read?',
    a: 'Anything you can photograph with a clear question in it — standardized tests, state assessments, entrance exams, certification prep, workplace training modules. Structured problems come back sharpest.',
  },
  {
    q: 'Do I need an account on every device?',
    a: 'One account, any number of devices. Log in on the phone you happen to be holding.',
  },
  {
    q: 'Can I cancel whenever?',
    a: 'Yes. No contract, no retention call, no email asking you to reconsider.',
  },
];

const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cambo App',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any (web-based)',
  url: 'https://camboapp.com/',
  description: 'Point your phone at any practice question and get the answer in seconds. No app store, no install.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

function Landing() {
  const { user, loading } = useAuthContext();
  const [qi, setQi] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  const q = QUESTIONS[qi];
  const step = (dir) => {
    setQi((i) => (i + dir + QUESTIONS.length) % QUESTIONS.length);
    setRevealed(false);
  };
  const toggleReveal = () => {
    if (revealed) {
      setQi((i) => (i + 1) % QUESTIONS.length);
      setRevealed(false);
    } else {
      setRevealed(true);
    }
  };

  return (
    <div className="zn-root">
      <Seo
        title="Cambo App — This Is Not an App for Cheating"
        description="Point your phone at a question and get the answer in seconds. For everyone stuck in a class, a compliance module, or a test they never asked for."
        path="/"
      >
        {ZineFonts}
        <script type="application/ld+json">{JSON.stringify(SOFTWARE_APP_SCHEMA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Seo>

      <div className="zn-grain" />
      <ZineHeader user={user} />

      <div id="top" className="zn-hero">
        <div className="zn-hero-tag-row">
          <span className="zn-tag">Read this part first</span>
        </div>
        <h1>
          This is{' '}
          <span className="zn-underline">
            not
            <ZineUnderline color="#cf5f33" />
          </span>{' '}
          an app for cheating.
        </h1>
        <div className="zn-hero-bottom">
          <p className="zn-hero-sub">
            (But you do get the answer in{' '}
            <span className="zn-circle">
              ten seconds
              <ZineCircleThin color="#cf5f33" />
            </span>
            .)
          </p>
          <Link to="/register" className="zn-btn">
            Point it at something
            <ZineArrow color="#f0ece1" />
          </Link>
        </div>
      </div>

      <div className="zn-ticker">
        <div className="zn-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i}>
              {item}
              <span className="zn-ticker-star"> ✷</span>
            </span>
          ))}
        </div>
      </div>

      <div id="how" className="zn-section">
        <div className="zn-section-head">
          <h2 className="zn-h2">
            Four seconds,
            <br />
            not four minutes.
          </h2>
        </div>
        <div className="zn-grid3">
          {STEPS.map((step, i) => (
            <div className="zn-grid3-item" key={step.title}>
              <span className="zn-grid3-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="demo" className="zn-section">
        <div className="zn-section-head">
          <h2 className="zn-h2" style={{ maxWidth: '20ch' }}>
            This is what it hands back.
          </h2>
        </div>
        <div className="zn-demo-grid">
          <div className="zn-demo-question">
            <div className="zn-demo-cat">
              <span className="zn-demo-cat-dot" />
              <span className="zn-demo-cat-label">{q.category}</span>
            </div>
            <p className="zn-demo-prompt">{q.prompt}</p>
            <div className="zn-demo-options">
              {q.options.map((text, n) => {
                const hit = revealed && n === q.answer;
                return (
                  <div className={`zn-demo-option${hit ? ' zn-demo-option-hit' : ''}`} key={text}>
                    <span className="zn-demo-option-letter">{LETTERS[n]}</span>
                    <span className="zn-demo-option-text">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="zn-demo-answer-col">
            <div className="zn-torn-card">
              <ZineTornBorder variant={0} />
              <span className="zn-torn-card-label">Cambo says</span>
              {revealed ? (
                <div>
                  <div className="zn-answer-row">
                    <span className="zn-answer-letter">{LETTERS[q.answer]}</span>
                    <span className="zn-answer-text">{q.options[q.answer]}</span>
                  </div>
                  <p className="zn-answer-rationale">{q.rationale}</p>
                </div>
              ) : (
                <div>
                  <p className="zn-pending-title">Waiting on the shutter.</p>
                  <p className="zn-pending-body">Tap capture and the answer lands here in about the time it takes to look up.</p>
                </div>
              )}
            </div>

            <div className="zn-demo-controls">
              <button type="button" className="zn-reveal-btn" onClick={toggleReveal}>
                {revealed ? 'Scan another' : 'Tap capture'}
              </button>
              <div className="zn-step-arrows">
                <button type="button" className="zn-step-arrow" aria-label="Previous question" onClick={() => step(-1)}>
                  ‹
                </button>
                <button type="button" className="zn-step-arrow" aria-label="Next question" onClick={() => step(1)}>
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="why" className="zn-section">
        <div className="zn-section-head">
          <h2 className="zn-h2" style={{ maxWidth: '22ch' }}>
            Built around the session, not the app.
          </h2>
        </div>
        <div className="zn-why-grid">
          {WHY_CARDS.map((card, i) => (
            <div className="zn-why-card" key={card.title} style={{ transform: `rotate(${[-0.6, 0.5, -0.35][i]}deg)` }}>
              <ZineTornBorder variant={i} />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="who" className="zn-section zn-who">
        <div style={{ marginBottom: 'clamp(26px, 3vw, 42px)' }}>
          <span className="zn-who-label">
            Who this is for
            <ZineCircleWord color="#e08a63" />
          </span>
          <h2>For everyone stuck in a class they never asked for.</h2>
        </div>
        <div className="zn-grid3">
          {WHO_CARDS.map((card) => (
            <div className="zn-grid3-item" key={card.title}>
              <span className="zn-who-kicker">{card.kicker}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="faq" className="zn-section">
        <h2 className="zn-h2" style={{ marginBottom: 'clamp(24px, 3vw, 38px)' }}>
          Questions, answered.
        </h2>
        <div className="zn-faq-list">
          {FAQS.map((faq) => (
            <details className="zn-faq-item" key={faq.q}>
              <summary>
                {faq.q}
                <span className="zn-plus">+</span>
              </summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <ZineResources />

      <div className="zn-footer-cta">
        <h2>Nobody grades you on how long it took.</h2>
        <Link to="/register" className="zn-btn">
          Get started free
          <ZineArrow color="#f0ece1" />
        </Link>
      </div>

      <footer className="zn-footer">
        <div>
          <div className="zn-footer-wordmark">Cambo</div>
          <div className="zn-footer-sub">© 2026 · Still not an app for cheating</div>
        </div>
        <nav className="zn-footer-nav">
          <a href="#how">How it works</a>
          <Link to="/pricing">Pricing</Link>
          <a href="#faq">FAQ</a>
          <a href="#resources">Resources</a>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}

export default Landing;
