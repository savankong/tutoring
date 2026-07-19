import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';

function daysRemaining(trialEndsAt) {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function Account() {
  const { user, refresh } = useAuthContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const goToStripe = async (functionName) => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/.netlify/functions/logout', { method: 'POST', credentials: 'include' });
    await refresh();
    navigate('/');
  };

  if (!user) return null;

  const isActive = user.subscription_status === 'active';

  return (
    <div className="App">
      <div className="top-nav">
        <Link to="/app">Capture</Link>
        <Link to="/history">History</Link>
        {user.role === 'admin' && <Link to="/admin">Admin</Link>}
      </div>
      <h1>Account</h1>

      <p>{user.email}</p>

      {isActive ? (
        <p>Subscription: active — $15/month</p>
      ) : (
        <p>Free trial: {daysRemaining(user.trial_ends_at)} day(s) left</p>
      )}

      {user.in_overage ? (
        <p className="usage-note">
          {user.captures_used} of {user.captures_cap} captures this month
        </p>
      ) : (
        <p>
          {Math.min(user.captures_used, user.captures_cap)} / {user.captures_cap} captures used this month
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="actions">
        {isActive ? (
          <button disabled={busy} onClick={() => goToStripe('create-portal-session')}>
            {busy ? 'Loading…' : 'Manage billing'}
          </button>
        ) : (
          <button disabled={busy} onClick={() => goToStripe('create-checkout-session')}>
            {busy ? 'Loading…' : 'Upgrade — $15/month'}
          </button>
        )}
        <button className="secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default Account;
