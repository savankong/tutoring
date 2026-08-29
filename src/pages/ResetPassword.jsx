import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import AuthNav from '../components/AuthNav.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';

function ResetPassword() {
  const { refresh } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState(token ? '' : 'This reset link is missing its token.');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset password.');
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
        title="Reset Password — Cambo App"
        description="Set a new password for your Cambo App account."
        path="/reset-password"
        noindex
      />
      <AuthNav />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-logo">
            <Logo size={18} wordmark />
          </div>
          <h1>Set a new password</h1>
          <form onSubmit={onSubmit} className="auth-form">
            <label>
              <span className="auth-label">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={!token}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={submitting || !token}>
              {submitting ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        </div>
        <p className="auth-switch">
          <Link to="/login">← Back to log in</Link>
        </p>
      </div>
    </>
  );
}

export default ResetPassword;
