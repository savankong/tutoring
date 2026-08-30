import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import ZineAuthNav from '../components/zine/ZineAuthNav.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import '../styles/zine.css';

function VerifyEmail() {
  const { refresh } = useAuthContext();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState(token ? 'verifying' : 'missing'); // verifying, success, error, missing

  useEffect(() => {
    if (!token) return;
    fetch('/api/verify-email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not verify your email.');
        await refresh();
        setStatus('success');
      })
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <>
      <Seo
        title="Verify Email — Cambo App"
        description="Verify your Cambo App email address."
        path="/verify-email"
        noindex
      />
      <div className="zn-root">
        <ZineAuthNav />
        <div className="zn-auth-page">
          <div className="zn-auth-card">
            <div className="zn-auth-card-logo">
              <Logo size={18} wordmark />
            </div>
            <h1>
              {status === 'verifying' && 'Verifying your email…'}
              {status === 'success' && 'Email verified'}
              {status === 'error' && 'Verification failed'}
              {status === 'missing' && 'Missing verification link'}
            </h1>
            <p className="zn-auth-subhead">
              {status === 'verifying' && 'One moment.'}
              {status === 'success' && "You're all set — captures are unlocked."}
              {status === 'error' && 'This link is invalid or has expired. Request a new one from your account page.'}
              {status === 'missing' && 'This link is missing its token.'}
            </p>
            {status === 'success' && (
              <Link to="/app" className="zn-pill-btn">
                Go to app
              </Link>
            )}
            {status === 'error' && (
              <Link to="/account" className="zn-pill-btn">
                Go to account
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default VerifyEmail;
