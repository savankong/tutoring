import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

function AdminSubmissions() {
  const [captures, setCaptures] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

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

      <div className="admin-row-actions admin-submissions-toolbar">
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

      {captures && captures.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Title</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {captures.map((c) => {
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
