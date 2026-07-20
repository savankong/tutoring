import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import Logo from '../components/Logo.jsx';

function Login() {
  const { refresh } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') || '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not log in.');
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
          <h1>Log in</h1>
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
                autoComplete="current-password"
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
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
          No account yet? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </>
  );
}

export default Login;
