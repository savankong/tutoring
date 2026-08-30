import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import ZineAuthNav from '../components/zine/ZineAuthNav.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import { PLANS, PASSES } from '../lib/plans.js';
import '../styles/zine.css';

const PAID_PLAN_KEYS = new Set(['starter', 'personal', 'pro']);
const PASS_KEYS = new Set(PASSES.map((p) => p.key));

function Register() {
  const { refresh } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestedPlan = searchParams.get('plan');
  const plan = PAID_PLAN_KEYS.has(requestedPlan) ? PLANS.find((p) => p.key === requestedPlan) : null;
  const requestedPass = searchParams.get('pass');
  // A pass is only relevant when there's no plan request too — the two CTAs
  // (subscription vs. one-time pass) are mutually exclusive on the pricing
  // page, so this never has to arbitrate between both being present.
  const pass = !plan && PASS_KEYS.has(requestedPass) ? PASSES.find((p) => p.key === requestedPass) : null;
  const ref = searchParams.get('ref');
  const googleStartUrl = ref
    ? `/api/google-oauth-start?ref=${encodeURIComponent(ref)}`
    : '/api/google-oauth-start';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, ref }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create account.');
      await refresh();

      if (plan) {
        const checkoutRes = await fetch('/api/create-checkout-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plan: plan.key }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
        // Account was created either way — just land on the app instead of
        // blocking signup on a checkout hiccup; they can upgrade from there.
      }

      if (pass) {
        const checkoutRes = await fetch('/api/create-pass-checkout-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pass: pass.key }),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutRes.ok && checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title={plan ? `Sign up for ${plan.name} — Cambo App` : pass ? `Get the ${pass.name} — Cambo App` : 'Sign Up Free — Cambo App'}
        description="Create a free Cambo App account — no credit card required."
        path="/register"
        noindex
      />
      <div className="zn-root">
        <ZineAuthNav />
        <div className="zn-auth-page">
          <div className="zn-auth-card">
            <div className="zn-auth-card-logo">
              <Logo size={18} wordmark />
            </div>
            <h1>{plan ? `Sign up for ${plan.name}` : pass ? `Get the ${pass.name}` : 'Create your free account'}</h1>
            <p className="zn-auth-subhead">
              {plan
                ? `${plan.price}${plan.period} — you'll finish checkout right after this.`
                : pass
                  ? `${pass.price}, ${pass.captureCap} captures, ${pass.duration} — you'll finish checkout right after this.`
                  : 'No card required. Upgrade any time.'}
            </p>
            <form onSubmit={onSubmit} className="zn-auth-form">
              <label>
                <span className="zn-auth-label">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                <span className="zn-auth-label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              {error && <p className="zn-error-text">{error}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? 'Creating account…' : plan || pass ? 'Continue to payment' : 'Create account'}
              </button>
            </form>
            <p className="zn-auth-consent">
              By creating an account, you agree to Cambo's <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
            <div className="zn-auth-divider">
              <span>or continue with</span>
            </div>
            <a className="zn-google-btn" href={googleStartUrl}>
              <GoogleIcon />
              Continue with Google
            </a>
          </div>
          <p className="zn-auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;
