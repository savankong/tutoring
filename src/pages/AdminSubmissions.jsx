import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminNav from '../components/AdminNav.jsx';
import Logo from '../components/Logo.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const EMPTY_DRAFT = {
  title: '',
  question_text: '',
  answer: '',
  explanation: '',
  why_others_wrong: '',
};

// (label, sort key) pairs, in the order the columns render.
const COLUMNS = [
  { key: 'user_email', label: 'User' },
  { key: 'title', label: 'Title' },
  { key: 'question_text', label: 'Question' },
  { key: 'answer', label: 'Answer' },
  { key: 'created_at', label: 'Created' },
];

function AdminSubmissions() {
  const [searchParams] = useSearchParams();
  const [captures, setCaptures] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [filterText, setFilterText] = useState('');
  const [selectedUser, setSelectedUser] = useState(searchParams.get('user') ?? '');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);

  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState({ user_email: '', ...EMPTY_DRAFT });
  const [createError, setCreateError] = useState('');

  const loadCaptures = () => {
    fetch('/.netlify/functions/admin-list-captures', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load submissions.');
        setCaptures(data.captures);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(loadCaptures, []);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const userOptions = useMemo(() => {
    if (!captures) return [];
    return [...new Set(captures.map((c) => c.user_email))].sort((a, b) => a.localeCompare(b));
  }, [captures]);

  const visibleCaptures = useMemo(() => {
    if (!captures) return null;
    const q = filterText.trim().toLowerCase();
    let filtered = selectedUser ? captures.filter((c) => c.user_email === selectedUser) : captures;
    if (q) {
      filtered = filtered.filter((c) =>
        [c.user_email, c.title, c.question_text, c.answer, c.explanation, c.why_others_wrong].some((v) =>
          (v ?? '').toLowerCase().includes(q),
        ),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? '';
      let bv = b[sortKey] ?? '';
      if (sortKey === 'created_at') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [captures, filterText, selectedUser, sortKey, sortDir]);

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditDraft({
      title: c.title ?? '',
      question_text: c.question_text ?? '',
      answer: c.answer ?? '',
      explanation: c.explanation ?? '',
      why_others_wrong: c.why_others_wrong ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(EMPTY_DRAFT);
  };

  const saveEdit = async (id) => {
    setError('');
    setBusyId(id);
    try {
      const res = await fetch('/.netlify/functions/admin-update-capture', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...editDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save submission.');
      setEditingId(null);
      loadCaptures();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteCapture = async (id) => {
    if (!confirm('Delete this submission? This removes it from the user’s history too and cannot be undone.'))
      return;
    setError('');
    setBusyId(id);
    try {
      const res = await fetch('/.netlify/functions/admin-delete-capture', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete submission.');
      loadCaptures();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const createCapture = async () => {
    setCreateError('');
    if (!createDraft.user_email.trim()) {
      setCreateError('User email is required.');
      return;
    }
    if (!createDraft.answer.trim()) {
      setCreateError('Answer is required.');
      return;
    }
    setBusyId('new');
    try {
      const res = await fetch('/.netlify/functions/admin-create-capture', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(createDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create submission.');
      setCreating(false);
      setCreateDraft({ user_email: '', ...EMPTY_DRAFT });
      loadCaptures();
    } catch (err) {
      setCreateError(err.message);
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
      <h2 className="page-title">Submissions</h2>
      <p className="account-cancel-note">
        Every question and answer any user has captured. Edit or delete a submission directly — changes apply to
        the user's own history too.
      </p>

      {error && <p className="error-text">{error}</p>}

      <div className="admin-submissions-toolbar">
        <select
          className="admin-filter-select"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">All users</option>
          {userOptions.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="admin-filter-input"
          placeholder="Filter by title, question, or answer…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {(filterText || selectedUser) && (
          <button
            className="secondary"
            onClick={() => {
              setFilterText('');
              setSelectedUser('');
            }}
          >
            Clear filters
          </button>
        )}
        <button
          className="secondary"
          onClick={() => {
            setCreating((v) => !v);
            setCreateError('');
          }}
        >
          {creating ? 'Cancel' : '+ Add submission'}
        </button>
      </div>

      {creating && (
        <div className="admin-table-wrap">
          <div className="admin-edit-form">
            {createError && <p className="error-text">{createError}</p>}
            <label>
              User email
              <input
                type="email"
                value={createDraft.user_email}
                onChange={(e) => setCreateDraft({ ...createDraft, user_email: e.target.value })}
              />
            </label>
            <label>
              Title
              <input
                type="text"
                value={createDraft.title}
                onChange={(e) => setCreateDraft({ ...createDraft, title: e.target.value })}
              />
            </label>
            <label>
              Question
              <textarea
                value={createDraft.question_text}
                onChange={(e) => setCreateDraft({ ...createDraft, question_text: e.target.value })}
              />
            </label>
            <label>
              Answer
              <textarea
                value={createDraft.answer}
                onChange={(e) => setCreateDraft({ ...createDraft, answer: e.target.value })}
              />
            </label>
            <label>
              Explanation
              <textarea
                value={createDraft.explanation}
                onChange={(e) => setCreateDraft({ ...createDraft, explanation: e.target.value })}
              />
            </label>
            <label>
              Why others are wrong
              <textarea
                value={createDraft.why_others_wrong}
                onChange={(e) => setCreateDraft({ ...createDraft, why_others_wrong: e.target.value })}
              />
            </label>
            <div className="admin-row-actions">
              <button disabled={busyId === 'new'} onClick={createCapture}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {!error && !captures && <p>Loading…</p>}
      {captures?.length === 0 && <p>No submissions yet.</p>}
      {captures?.length > 0 && visibleCaptures.length === 0 && <p>No submissions match the current filters.</p>}
      {captures && captures.length > 0 && (
        <p className="admin-submissions-count">
          Showing {visibleCaptures.length} of {captures.length}
        </p>
      )}

      {visibleCaptures && visibleCaptures.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--fixed">
            <colgroup>
              <col style={{ width: '13%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="admin-sortable-th" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    {sortKey === col.key && <span className="admin-sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleCaptures.map((c) => {
                const busy = busyId === c.id;
                const isEditing = editingId === c.id;

                if (isEditing) {
                  return (
                    <tr key={c.id} className="admin-edit-row">
                      <td colSpan={6}>
                        <div className="admin-edit-form">
                          <p className="admin-edit-form-user">{c.user_email}</p>
                          <label>
                            Title
                            <input
                              type="text"
                              value={editDraft.title}
                              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            />
                          </label>
                          <label>
                            Question
                            <textarea
                              value={editDraft.question_text}
                              onChange={(e) => setEditDraft({ ...editDraft, question_text: e.target.value })}
                            />
                          </label>
                          <label>
                            Answer
                            <textarea
                              value={editDraft.answer}
                              onChange={(e) => setEditDraft({ ...editDraft, answer: e.target.value })}
                            />
                          </label>
                          <label>
                            Explanation
                            <textarea
                              value={editDraft.explanation}
                              onChange={(e) => setEditDraft({ ...editDraft, explanation: e.target.value })}
                            />
                          </label>
                          <label>
                            Why others are wrong
                            <textarea
                              value={editDraft.why_others_wrong}
                              onChange={(e) => setEditDraft({ ...editDraft, why_others_wrong: e.target.value })}
                            />
                          </label>
                          <div className="admin-row-actions">
                            <button disabled={busy} onClick={() => saveEdit(c.id)}>
                              Save
                            </button>
                            <button className="secondary" disabled={busy} onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={c.id}>
                    <td>{c.user_email}</td>
                    <td className="admin-question-cell">{c.title}</td>
                    <td className="admin-question-cell">{c.question_text}</td>
                    <td className="admin-question-cell">{c.answer}</td>
                    <td>{formatDate(c.created_at)}</td>
                    <td className="admin-row-actions">
                      <button className="secondary" disabled={busy} onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button className="secondary" disabled={busy} onClick={() => deleteCapture(c.id)}>
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

export default AdminSubmissions;
