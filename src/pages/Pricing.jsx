import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import SiteNav from '../components/SiteNav.jsx';
import Seo from '../components/Seo.jsx';
import { PLANS } from '../lib/plans.js';

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
      const res = await fetch('/.netlify/functions/create-checkout-session', {
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
    <div className="landing">
      <Seo
        title="Pricing — Cambo App"
        description="Free forever up to 20 captures a month. Paid plans from $4.99/mo for daily tutoring use. Cancel anytime, no contract."
        path="/pricing"
      />
      <SiteNav />

      <section className="pricing-page">
        <div className="pricing-page-head">
          <div className="section-eyebrow">Pricing</div>
          <h1>Start using it for free today — no credit card needed.</h1>
          <p>From an occasional session to a full tutoring practice — plans that grow with how you use it.</p>
        </div>

        {error && <p className="pricing-page-error error-text">{error}</p>}

        <div className="tier-grid">
          {PLANS.map((tier) => {
            const isCurrentPlan = user && user.plan === tier.key;
            return (
              <div
                className={`tier-card${tier.featured ? ' tier-card-featured' : ''}`}
                key={tier.key}
              >
                {isCurrentPlan ? (
                  <span className="tier-badge tier-badge-current">Current plan</span>
                ) : (
                  tier.featured && <span className="tier-badge">Best value</span>
                )}
                <div className="tier-name">{tier.name}</div>
                <div className="tier-tagline">{tier.tagline}</div>
                <div className="tier-price-row">
                  <span className="tier-price">{tier.price}</span>
                  <span className="tier-period">{tier.period}</span>
                </div>
                <div className="tier-features">
                  {tier.features.map((f) => (
                    <div className="tier-feature" key={f}>
                      <span className="tier-feature-check">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="tier-cta">
                  {isCurrentPlan ? (
                    <Link to="/account" className="pill-button pill-button-outline">
                      Manage this plan
                    </Link>
                  ) : (
                    <button disabled={busyKey === tier.key} onClick={() => choosePlan(tier.key)}>
                      {busyKey === tier.key ? 'Loading…' : tier.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Pricing;
