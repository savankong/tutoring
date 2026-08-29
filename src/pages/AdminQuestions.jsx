import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/AdminNav.jsx';
import Logo from '../components/Logo.jsx';

function AdminQuestions() {
  const [questions, setQuestions] = useState(null);
  const [questionsError, setQuestionsError] = useState('');
  const [busyQuestionId, setBusyQuestionId] = useState(null);

  const loadQuestions = () => {
    fetch('/api/admin-list-public-questions', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load public questions.');
        setQuestions(data.questions);
      })
      .catch((err) => setQuestionsError(err.message));
  };

  useEffect(loadQuestions, []);

  const toggleQuestionPublished = async (id, published) => {
    setQuestionsError('');
    setBusyQuestionId(id);
    try {
      const res = await fetch('/api/admin-update-public-question', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update question.');
      loadQuestions();
    } catch (err) {
      setQuestionsError(err.message);
    } finally {
      setBusyQuestionId(null);
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
      <h2 className="page-title">Public Question Bank</h2>
      <p className="account-cancel-note">
        Real captured questions auto-published onto their matching landing page. Unpublish anything that's wrong,
        low-quality, or the subject of a copyright complaint — it stays in the database, just stops rendering
        publicly.
      </p>

      {questionsError && <p className="error-text">{questionsError}</p>}
      {!questionsError && !questions && <p>Loading…</p>}
      {questions?.length === 0 && <p>No public questions yet.</p>}

      {questions && questions.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Seen</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => {
                const busy = busyQuestionId === q.id;
                return (
                  <tr key={q.id}>
                    <td>{q.topic_slug}</td>
                    <td className="admin-question-cell">{q.question}</td>
                    <td className="admin-question-cell">{q.answer}</td>
                    <td>{q.times_seen}</td>
                    <td>{q.published ? 'Published' : 'Unpublished'}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => toggleQuestionPublished(q.id, !q.published)}
                        >
                          {q.published ? 'Unpublish' : 'Republish'}
                        </button>
                      </div>
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

export default AdminQuestions;
