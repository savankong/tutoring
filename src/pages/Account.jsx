import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';

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

      <p>
        Plan: {user.plan_name}
        {isActive && ' — active'}
        {user.subscription_status === 'past_due' && ' — payment past due'}
      </p>

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
          <Link to="/pricing" className="pill-button">
            View plans
          </Link>
        )}
        {isActive && (
          <Link to="/pricing" className="pill-button pill-button-outline">
            Change plan
          </Link>
        )}
        <button className="secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

export default Account;
