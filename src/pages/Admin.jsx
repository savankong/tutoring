import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminNav from '../components/AdminNav.jsx';
import Logo from '../components/Logo.jsx';
import { useAuthContext } from '../lib/AuthContext.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Mirrors the keys in netlify/lib/plans.js — kept as a small local list
// (not imported) since that file is backend-only. "Unlimited" is the
// admin-only comp tier: no cap, no credits ever required.
const PLAN_OPTIONS = [
  { key: 'free', label: 'Free' },
  { key: 'starter', label: 'Starter' },
  { key: 'personal', label: 'Personal' },
  { key: 'pro', label: 'Pro' },
  { key: 'unlimited', label: 'Unlimited (comp)' },
];

function Admin() {
  const { user: me } = useAuthContext();
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadUsers = () => {
    fetch('/.netlify/functions/admin-list-users', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load users.');
        setUsers(data.users);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(loadUsers, []);

  const updateUser = async (userId, patch) => {
    setError('');
    setBusyId(userId);
    try {
      const res = await fetch('/.netlify/functions/admin-update-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update user.');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Delete ${email}? This also deletes their capture history.`)) return;
    setError('');
    setBusyId(userId);
    try {
      const res = await fetch('/.netlify/functions/admin-delete-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete user.');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="App admin-page">
      <div className="top-nav">
        <Link to="/app">Capture</Link>
        <Link to="/history">History</Link>
        <Link to="/account">Account</Link>
      </div>
      <h1>
        <Logo size={26} wordmark />
      </h1>
      <AdminNav />
      <h2 className="page-title">Admin — Users</h2>

      {error && <p className="error-text">{error}</p>}
      {!error && !users && <p>Loading…</p>}

      {users && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Credits</th>
                <th>Subscription</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === me.id;
                const isAdmin = u.role === 'admin';
                const busy = busyId === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        value={u.plan}
                        disabled={busy}
                        onChange={(e) => updateUser(u.id, { plan: e.target.value })}
                      >
                        {PLAN_OPTIONS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{u.credit_balance ?? 0}</td>
                    <td>{u.subscription_status}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td className="admin-row-actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => navigate(`/admin/submissions?user=${encodeURIComponent(u.email)}`)}
                      >
                        View submissions
                      </button>
                      <button
                        className="secondary"
                        disabled={busy || (isSelf && isAdmin)}
                        onClick={() => updateUser(u.id, { role: isAdmin ? 'user' : 'admin' })}
                      >
                        {isAdmin ? 'Remove admin' : 'Make admin'}
                      </button>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          const input = prompt(`Add how many credits to ${u.email}? (negative to deduct)`, '100');
                          if (input === null) return;
                          const amount = parseInt(input, 10);
                          if (!Number.isInteger(amount) || amount === 0) return;
                          updateUser(u.id, { add_credits: amount });
                        }}
                      >
                        Add credits
                      </button>
                      <button
                        className="secondary"
                        disabled={busy || isSelf}
                        onClick={() => deleteUser(u.id, u.email)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;
