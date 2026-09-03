import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import ZineAuthNav from '../components/zine/ZineAuthNav.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import '../styles/zine.css';

function Login() {
  const { refresh } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');
  const [googleAccount, setGoogleAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGoogleAccount(false);
    setSubmitting(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Surfaced as an inline Google button below, not just an error
        // sentence — a Google-only account can never log in with a
        // password, so the fix is one click, not a hint to go read.
        if (data.code === 'google_account') {
          setGoogleAccount(true);
          return;
        }
        throw new Error(data.error || 'Could not log in.');
      }
      await refresh();
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
        title="Log In — Cambo App"
        description="Log in to your Cambo App account."
        path="/login"
        noindex
      />
      <div className="zn-root">
        <ZineAuthNav />
        <div className="zn-auth-page">
          <div className="zn-auth-card">
            <div className="zn-auth-card-logo">
              <Logo size={18} wordmark />
            </div>
            <h1>Log in</h1>
            {googleAccount ? (
              // Replaces the form entirely rather than adding a note next to
              // it — a password will never work for this email, so there's
              // nothing left for the form to do here except get in the way
              // of the one action that actually works.
              <div className="zn-auth-google-only">
                <p className="zn-auth-subhead">
                  <strong>{email}</strong> signs in with Google, not a password. Continue below to log in.
                </p>
                <a className="zn-google-btn" href="/api/google-oauth-start">
                  <GoogleIcon />
                  Continue with Google
                </a>
                <button type="button" className="zn-auth-forgot" onClick={() => setGoogleAccount(false)}>
                  Try a different email
                </button>
              </div>
            ) : (
              <>
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
                      autoComplete="current-password"
                    />
                  </label>
                  <Link to="/forgot-password" className="zn-auth-forgot">
                    Forgot password?
                  </Link>
                  {error && <p className="zn-error-text">{error}</p>}
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Logging in…' : 'Log in'}
                  </button>
                </form>
                <div className="zn-auth-divider">
                  <span>or continue with</span>
                </div>
                <a className="zn-google-btn" href="/api/google-oauth-start">
                  <GoogleIcon />
                  Continue with Google
                </a>
              </>
            )}
          </div>
          <p className="zn-auth-switch">
            No account yet? <Link to="/register">Sign up free</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
