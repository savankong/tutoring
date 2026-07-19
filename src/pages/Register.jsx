import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';

function Register() {
  const { refresh } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-logo">📸 Cambo App</div>
        <h1>Start your free trial</h1>
        <p className="auth-subhead">7 days free, no card required.</p>
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
            {submitting ? 'Creating account…' : 'Start free trial'}
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
  );
}

export default Register;
