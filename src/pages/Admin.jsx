import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Admin() {
  const { user: me } = useAuthContext();
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
                <th>Subscription</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === me.id;
                const isAdmin = u.role === 'admin';
                const isPaid = u.subscription_status === 'active';
                const busy = busyId === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.plan}</td>
                    <td>{u.subscription_status}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td className="admin-row-actions">
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
                        onClick={() => updateUser(u.id, { subscription_status: isPaid ? 'none' : 'active' })}
                      >
                        {isPaid ? 'Revoke paid' : 'Grant paid'}
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
