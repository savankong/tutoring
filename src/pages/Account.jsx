import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { PLANS, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CENTS } from '../lib/plans.js';

const UPGRADE_PLANS = PLANS.filter((p) => p.key === 'starter' || p.key === 'personal' || p.key === 'pro');
const PACK_PRICE = CREDIT_PACK_PRICE_CENTS / 100;

function Account() {
  const { user, refresh } = useAuthContext();
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [packQty, setPackQty] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

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

  const purchaseCredits = async () => {
    setError('');
    setPurchasing(true);
    try {
      const res = await fetch('/.netlify/functions/create-credit-checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ packs: packQty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPurchasing(false);
    }
  };

  const logout = async () => {
    await fetch('/.netlify/functions/logout', { method: 'POST', credentials: 'include' });
    await refresh();
    navigate('/');
  };

  if (!user) return null;

  const isActive = user.subscription_status === 'active';
  const currentPlan = PLANS.find((p) => p.key === user.plan);
  const capPercent = Math.min(100, Math.round((user.captures_used / user.captures_cap) * 100));
  const totalCredits = packQty * CREDIT_PACK_SIZE;
  const totalCost = (packQty * PACK_PRICE).toFixed(2);

  const closeModal = () => {
    if (purchasing) return;
    setShowPurchaseModal(false);
    setPackQty(1);
  };

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

      {error && <p className="error-text">{error}</p>}

      <div className="account-card">
        <div className="account-card-head">
          <div>
            <div className="account-card-title">Plan details</div>
            <div className="account-card-sub">
              {user.plan_name}
              {isActive && ' — active'}
              {user.subscription_status === 'past_due' && ' — payment past due'}
            </div>
          </div>
          {currentPlan && (
            <div className="account-plan-price">
              {currentPlan.price}
              <span>{currentPlan.period}</span>
            </div>
          )}
        </div>
        {isActive && (
          <div className="actions account-card-actions">
            <button disabled={busyKey === 'portal'} onClick={openPortal}>
              {busyKey === 'portal' ? 'Loading…' : 'Manage billing'}
            </button>
            <Link to="/pricing" className="pill-button pill-button-outline pill-button-sm">
              Change plan
            </Link>
          </div>
        )}
      </div>

      <div className="account-card">
        <div className="account-card-title">Usage this month</div>
        <div className="account-usage-row">
          <span>
            {Math.min(user.captures_used, user.captures_cap)} / {user.captures_cap} captures
          </span>
          {user.using_credits && <span className="account-usage-credits-tag">using credits</span>}
        </div>
        <div className="account-progress">
          <div className="account-progress-bar" style={{ width: `${capPercent}%` }} />
        </div>
        {user.credits_allowed && user.grace_buffer > 0 && (
          <p className="account-cancel-note">
            Includes a {user.grace_buffer}-capture grace buffer before credits are used.
          </p>
        )}
      </div>

      {user.credits_allowed && (
        <div className="account-card">
          <div className="account-card-head">
            <div>
              <div className="account-card-title">Credit balance</div>
              <div className="account-card-sub">Rolls over every month while you're on a paid plan.</div>
            </div>
          </div>
          <div className="account-credit-balance">{user.credit_balance.toLocaleString()} credits</div>
          <button className="pill-button pill-button-sm" onClick={() => setShowPurchaseModal(true)}>
            Purchase credits
          </button>
        </div>
      )}

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

      {showPurchaseModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Purchase credits</h3>
            <p className="account-cancel-note">
              Each pack contains {CREDIT_PACK_SIZE} credits for ${PACK_PRICE.toFixed(2)}. Credits roll over to next
              month and don't expire as long as you stay on a paid plan.
            </p>
            <label className="modal-qty-row">
              <span>Credit packs</span>
              <input
                type="number"
                min={1}
                max={20}
                value={packQty}
                onChange={(e) => {
                  const next = parseInt(e.target.value, 10);
                  setPackQty(Number.isFinite(next) ? Math.max(1, Math.min(20, next)) : 1);
                }}
              />
            </label>
            <div className="modal-summary-row">
              <span>Total credits</span>
              <span>{totalCredits.toLocaleString()}</span>
            </div>
            <div className="modal-summary-row">
              <span>Total cost</span>
              <span>${totalCost}</span>
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="actions">
              <button disabled={purchasing} onClick={purchaseCredits}>
                {purchasing ? 'Loading…' : `Purchase ${packQty} pack${packQty > 1 ? 's' : ''} for $${totalCost}`}
              </button>
              <button className="secondary" disabled={purchasing} onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;
