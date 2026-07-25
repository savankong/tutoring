import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { PLANS, CREDIT_PACK_SIZE, CREDIT_PACK_PRICE_CENTS } from '../lib/plans.js';

const UPGRADE_PLANS = PLANS.filter((p) => p.key === 'starter' || p.key === 'personal' || p.key === 'pro');
const PACK_PRICE = CREDIT_PACK_PRICE_CENTS / 100;
const SHORT_DATE = { month: 'short', day: 'numeric' };
const LONG_DATE = { month: 'long', day: 'numeric', year: 'numeric' };

function currentPeriodBounds(periodStartIso) {
  if (periodStartIso) {
    const start = new Date(periodStartIso);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }
  // No subscription period on record (Free tier) — usage resets on the
  // calendar month instead, so mirror that here for display.
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function Account() {
  const { user, refresh } = useAuthContext();
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [packQty, setPackQty] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);

  const planSectionRef = useRef(null);
  const usageSectionRef = useRef(null);
  const creditsSectionRef = useRef(null);
  const scrollToSection = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

  const togglePublicCapturesOptOut = async (optOut) => {
    setError('');
    setSavingPrivacy(true);
    try {
      const res = await fetch('/.netlify/functions/update-account-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ public_captures_opt_out: optOut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const resendVerification = async () => {
    setError('');
    setResendingVerification(true);
    try {
      const res = await fetch('/.netlify/functions/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setVerificationResent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendingVerification(false);
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
  const capPercent = Number.isFinite(user.captures_cap)
    ? Math.min(100, Math.round((user.captures_used / user.captures_cap) * 100))
    : 0;
  const totalCredits = packQty * CREDIT_PACK_SIZE;
  const totalCost = (packQty * PACK_PRICE).toFixed(2);

  const { start: periodStart, end: periodEnd } = currentPeriodBounds(user.current_period_start);
  // The Unlimited (admin-comp) plan has no cap — captures_cap comes back as
  // null once Infinity round-trips through JSON, so every cap-based number
  // here needs a guard rather than dividing/comparing against it directly.
  const isUnlimited = !Number.isFinite(user.captures_cap);
  const inPlanUsed = isUnlimited ? user.captures_used : Math.min(user.captures_used, user.captures_cap);
  const graceUsed =
    user.credits_allowed && !isUnlimited
      ? Math.max(0, Math.min(user.captures_used - user.captures_cap, user.grace_buffer))
      : 0;
  const creditsUsed =
    user.credits_allowed && !isUnlimited
      ? Math.max(0, user.captures_used - user.captures_cap - user.grace_buffer)
      : 0;

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

      {error && <p className="error-text">{error}</p>}

      {!user.email_verified && (
        <div className="account-card">
          <div className="account-card-title">Verify your email</div>
          <div className="account-card-sub">
            Verify {user.email} to start using your captures. Check your inbox for a link, or resend it below. Not
            there? Check your spam/junk folder (or the "Other" tab in Outlook) — it can take a few minutes to
            arrive.
          </div>
          {verificationResent ? (
            <p className="usage-note">
              Verification email sent — check your inbox, and spam/junk if it doesn't show up in a minute or two.
            </p>
          ) : (
            <div className="actions account-card-actions">
              <button disabled={resendingVerification} onClick={resendVerification}>
                {resendingVerification ? 'Sending…' : 'Resend verification email'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="billing-summary-card">
        <div className="billing-summary-title">
          Usage &amp; billing for {user.email}
          <span className="billing-plan-badge">{user.plan_name}</span>
        </div>
        <div className="billing-summary-sub">
          Current period runs from {periodStart.toLocaleDateString(undefined, SHORT_DATE)} to{' '}
          {periodEnd.toLocaleDateString(undefined, SHORT_DATE)}.
        </div>

        <div className="billing-stat-row">
          <button className="billing-stat-tile" onClick={() => scrollToSection(usageSectionRef)}>
            <span className="billing-stat-label">
              Captures used <span className="billing-stat-arrow">→</span>
            </span>
            <span className="billing-stat-value">{isUnlimited ? `${inPlanUsed}` : `${inPlanUsed}/${user.captures_cap}`}</span>
          </button>
          {user.credits_allowed && (
            <button className="billing-stat-tile" onClick={() => scrollToSection(creditsSectionRef)}>
              <span className="billing-stat-label">
                Credits available <span className="billing-stat-arrow">→</span>
              </span>
              <span className="billing-stat-value">{user.credit_balance.toLocaleString()}</span>
            </button>
          )}
        </div>

        <Link to="/pricing" className="billing-learn-more">
          Learn more about plans on the pricing page ↗
        </Link>
      </div>

      <div className="account-section-head">
        <h3>Current services</h3>
        <p>Plan details and usage for your Cambo App account</p>
      </div>

      <div className="account-card" id="plan" ref={planSectionRef}>
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
        {currentPlan && (
          <ul className="account-feature-list">
            {currentPlan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        <div className="actions account-card-actions">
          {isActive ? (
            <>
              <button disabled={busyKey === 'portal'} onClick={openPortal}>
                {busyKey === 'portal' ? 'Loading…' : 'Manage billing'}
              </button>
              <Link to="/pricing" className="pill-button pill-button-outline pill-button-sm">
                Change plan
              </Link>
            </>
          ) : (
            <Link to="/pricing" className="pill-button pill-button-sm">
              Upgrade plan
            </Link>
          )}
        </div>
      </div>

      <div className="account-card" id="usage" ref={usageSectionRef}>
        <div className="account-card-title">Usage this period</div>
        {isUnlimited ? (
          <>
            <div className="account-card-sub">No monthly cap on this plan.</div>
            <div className="account-usage-row">
              <span>{inPlanUsed} captures</span>
            </div>
          </>
        ) : (
          <>
            <div className="account-card-sub">Capture consumption may take a minute to reflect.</div>
            <div className="account-usage-row">
              <span>
                {inPlanUsed} / {user.captures_cap} captures
              </span>
              {user.using_credits && <span className="account-usage-credits-tag">using credits</span>}
            </div>
            <div className="account-progress">
              <div className="account-progress-bar" style={{ width: `${capPercent}%` }} />
            </div>

            <div className="account-breakdown">
              <div className="account-breakdown-row">
                <span>Included in plan</span>
                <span>
                  {inPlanUsed} / {user.captures_cap}
                </span>
              </div>
              {user.credits_allowed && user.grace_buffer > 0 && (
                <div className="account-breakdown-row">
                  <span>Grace buffer</span>
                  <span>
                    {graceUsed} / {user.grace_buffer}
                  </span>
                </div>
              )}
              {user.credits_allowed && creditsUsed > 0 && (
                <div className="account-breakdown-row">
                  <span>From credits</span>
                  <span>{creditsUsed}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {user.credits_allowed && (
        <div className="account-card" id="credits" ref={creditsSectionRef}>
          <div className="account-card-title">Credit balance</div>
          <div className="account-card-sub">
            Credits are spent once your monthly cap and grace buffer run out, in the order they were purchased.
          </div>
          <div className="account-credit-balance-row">
            <span className="account-credit-balance">{user.credit_balance.toLocaleString()}</span>
            <span className="account-balance-tag">No expiration on a paid plan</span>
          </div>
          {user.last_credit_purchase && (
            <div className="account-card-sub">
              Last purchased {new Date(user.last_credit_purchase).toLocaleDateString(undefined, LONG_DATE)}
            </div>
          )}
          <div className="actions account-card-actions">
            <button className="pill-button pill-button-sm" onClick={() => setShowPurchaseModal(true)}>
              Purchase credits
            </button>
          </div>
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

      <div className="account-card">
        <div className="account-card-title">Privacy</div>
        <div className="account-card-sub">
          Cambo may anonymously publish real questions you capture — never your name or email — as free study
          questions on our public practice pages, to help other tutors. You can opt out any time.
        </div>
        <label className="account-toggle-row">
          <input
            type="checkbox"
            checked={!user.public_captures_opt_out}
            disabled={savingPrivacy}
            onChange={(e) => togglePublicCapturesOptOut(!e.target.checked)}
          />
          <span>Let Cambo publish my captured questions anonymously</span>
        </label>
      </div>

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
