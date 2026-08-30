import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Seo from '../components/Seo.jsx';
import ZineHeader from '../components/zine/ZineHeader.jsx';
import { ZineArrow } from '../components/zine/ZineArt.jsx';
import { PLANS } from '../lib/plans.js';
import '../styles/zine.css';

const FINE_PRINT = [
  { title: 'No annual lock-in', body: 'Month to month. Tutoring and test prep are seasonal and the billing should be too.' },
  { title: 'Downgrade freely', body: 'Drop back to Free between terms and pick it up again whenever you need it.' },
  { title: 'Nothing sold on', body: "Your captures are yours. We don't build a profile out of what you photograph." },
];

function Pricing() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');

  const choosePlan = async (planKey) => {
    if (planKey === 'free') {
      navigate(user ? '/app' : '/register');
      return;
    }
    if (!user) {
      navigate(`/register?plan=${planKey}`);
      return;
    }
    setError('');
    setBusyKey(planKey);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusyKey(null);
    }
  };

  return (
    <div className="zn-root">
      <Seo
        title="Pricing — Cambo App"
        description="Free forever up to 5 captures a month. Paid plans from $4.99/mo. Cancel anytime, no contract."
        path="/pricing"
      />

      <div className="zn-grain" />
      <ZineHeader user={user} />

      <div className="zn-pricing-hero">
        <span className="zn-tag">Pricing</span>
        <h1>Start free. Upgrade when you need more.</h1>
        <p>From an occasional capture to full daily use — plans that grow with how often you point it at something.</p>
      </div>

      {error && <p className="zn-error-text" style={{ padding: '20px clamp(20px, 5vw, 72px) 0' }}>{error}</p>}

      <div className="zn-tier-grid">
        {PLANS.map((tier) => {
          const isCurrentPlan = user && user.plan === tier.key;
          return (
            <div className={`zn-tier${tier.featured ? ' zn-tier-dark' : ''}`} key={tier.key}>
              <div className="zn-tier-badge-row">
                <h2>{tier.name}</h2>
                {isCurrentPlan ? <span className="zn-tier-flag">Current plan</span> : tier.featured && <span className="zn-tier-flag">Best value</span>}
              </div>
              <div className="zn-tier-tagline">{tier.tagline}</div>
              <div className="zn-tier-price-row">
                <span className="zn-tier-price">{tier.price}</span>
                <span className="zn-tier-period">{tier.period === 'forever' ? tier.period : 'per month'}</span>
              </div>
              <div className="zn-tier-features">
                {tier.features.map((f) => (
                  <span className="zn-tier-feature" key={f}>
                    <b>✓</b> {f}
                  </span>
                ))}
              </div>
              {isCurrentPlan ? (
                <Link to="/account" className="zn-tier-cta">
                  Manage this plan
                </Link>
              ) : (
                <button type="button" className="zn-tier-cta" disabled={busyKey === tier.key} onClick={() => choosePlan(tier.key)}>
                  {busyKey === tier.key ? 'Loading…' : tier.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="zn-section zn-fineprint">
        <h3>The fine print, in plain words</h3>
        <div className="zn-grid3">
          {FINE_PRINT.map((item) => (
            <div className="zn-grid3-item" key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="zn-footer-cta">
        <h2>Try it before you pay anyone anything.</h2>
        <Link to="/" className="zn-btn">
          Back to the front page
          <ZineArrow color="#f0ece1" />
        </Link>
      </div>

      <footer className="zn-footer">
        <div>
          <div className="zn-footer-wordmark">Cambo</div>
          <div className="zn-footer-sub">© 2026 · Still not an app for cheating</div>
        </div>
        <nav className="zn-footer-nav">
          <Link to="/">Home</Link>
          <a href="/#resources">Resources</a>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </footer>
    </div>
  );
}

export default Pricing;
