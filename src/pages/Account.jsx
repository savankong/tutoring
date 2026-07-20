import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { PLANS } from '../lib/plans.js';

const UPGRADE_PLANS = PLANS.filter((p) => p.key === 'personal' || p.key === 'pro');

function Account() {
  const { user, refresh } = useAuthContext();
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');

  const startCheckout = async (planKey) => {
    setError('');
    setBusyKey(planKey);
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusyKey(null);
    }
  };

  const openPortal = async () => {
    setError('');
    setBusyKey('portal');
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setBusyKey(null);
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

      <h1>
        <Logo size={26} wordmark />
      </h1>
      <h2 className="page-title">Account</h2>

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

      {!isActive && (
        <>
          <div className="account-upgrade-grid">
            {UPGRADE_PLANS.map((plan) => (
              <div className="account-upgrade-card" key={plan.key}>
                <div className="account-upgrade-name">{plan.name}</div>
                <div className="account-upgrade-price">
                  {plan.price}
                  <span>{plan.period}</span>
                </div>
                <button disabled={busyKey === plan.key} onClick={() => startCheckout(plan.key)}>
                  {busyKey === plan.key ? 'Loading…' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
          <p className="account-cancel-note">
            <Link to="/pricing">See the full plan comparison</Link>
          </p>
        </>
      )}

      <div className="actions">
        {isActive && (
          <button disabled={busyKey === 'portal'} onClick={openPortal}>
            {busyKey === 'portal' ? 'Loading…' : 'Manage billing'}
          </button>
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

      {isActive && (
        <p className="account-cancel-note">
          Manage billing lets you update your payment method, switch plans, or cancel your subscription anytime — no
          email required.
        </p>
      )}
    </div>
  );
}

export default Account;
