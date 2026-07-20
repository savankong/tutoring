import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import Logo from '../components/Logo.jsx';
import { PLANS } from '../lib/plans.js';

const PAID_PLAN_KEYS = new Set(['starter', 'personal', 'pro']);

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create account.');
      await refresh();

      if (plan) {
        const checkoutRes = await fetch('/.netlify/functions/create-checkout-session', {
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

      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <nav className="auth-nav">
        <Logo size={20} wordmark />
        <Link to="/" className="auth-nav-home">
          ← Home
        </Link>
      </nav>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-logo">
            <Logo size={18} wordmark />
          </div>
          <h1>{plan ? `Sign up for ${plan.name}` : 'Create your free account'}</h1>
          <p className="auth-subhead">
            {plan
              ? `${plan.price}${plan.period} — you'll finish checkout right after this.`
              : 'No card required. Upgrade any time.'}
          </p>
          <form onSubmit={onSubmit} className="auth-form">
            <label>
              <span className="auth-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              <span className="auth-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating account…' : plan ? 'Continue to payment' : 'Create account'}
            </button>
          </form>
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <a className="google-button" href="/.netlify/functions/google-oauth-start">
            <GoogleIcon />
            Continue with Google
          </a>
        </div>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </>
  );
}

export default Register;
