import { Link, Navigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';

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

  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <div className="landing">
      <section className="landing-hero">
        <h1>The answer key in your pocket. Point, tap, keep teaching.</h1>
        <p className="landing-subhead">
          Point your phone at any practice question. Get the answer in seconds. Stay in the room
          with your student instead of working the problem out yourself.
        </p>
        <Link to="/register" className="landing-cta">
          Start your free trial
        </Link>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <ol className="landing-steps">
          <li>Open the app on your phone (works right from your home screen, no app store needed).</li>
          <li>Point the camera at the question on the page or screen.</li>
          <li>Tap Capture. The answer comes back in a few seconds.</li>
          <li>Keep teaching. No fumbling for a calculator or losing your place mid-session.</li>
        </ol>
      </section>

      <section className="landing-section">
        <h2>Why tutors use it</h2>
        <ul className="landing-bullets">
          <li>
            You already know the material. This just gets you to the answer faster so you can
            spend your time explaining, not calculating.
          </li>
          <li>
            Built for live sessions. One button, camera stays on between captures, no menus to
            dig through while a student is watching you.
          </li>
          <li>
            Pays for itself fast. If it saves you 20 minutes across a month, it's already worth
            more than the subscription.
          </li>
        </ul>
      </section>

      <section className="landing-section landing-pricing">
        <h2>Pricing</h2>
        <p className="landing-price">$15/month. Cancel anytime, no contract.</p>
        <p>Includes 200 captures a month, plenty for daily tutoring use. Free 7-day trial, no card required.</p>
      </section>

      <section className="landing-section">
        <h2>FAQ</h2>
        <dl className="landing-faq">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="landing-footer-cta">
        <p>Stop losing the moment mid-session.</p>
        <Link to="/register" className="landing-cta">
          Start your free trial
        </Link>
      </section>
    </div>
  );
}

export default Landing;
