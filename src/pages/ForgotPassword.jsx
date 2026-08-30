import { useState } from 'react';
import { Link } from 'react-router-dom';
import ZineAuthNav from '../components/zine/ZineAuthNav.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import '../styles/zine.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Forgot Password — Cambo App"
        description="Reset your Cambo App password."
        path="/forgot-password"
        noindex
      />
      <div className="zn-root">
        <ZineAuthNav />
        <div className="zn-auth-page">
          <div className="zn-auth-card">
            <div className="zn-auth-card-logo">
              <Logo size={18} wordmark />
            </div>
            <h1>Reset your password</h1>
            {sent ? (
              <p className="zn-auth-subhead">
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your
                password. It expires in an hour.
              </p>
            ) : (
              <>
                <p className="zn-auth-subhead">
                  Enter your email and we'll send you a link to reset your password.
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
                  {error && <p className="zn-error-text">{error}</p>}
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </div>
          <p className="zn-auth-switch">
            <Link to="/login">← Back to log in</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
