import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';

function formatTimestamp(iso) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function History() {
  const { user } = useAuthContext();
  const [captures, setCaptures] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/.netlify/functions/history', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load history.');
        setCaptures(data.captures);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="App">
      <div className="top-nav">
        <Link to="/app">Capture</Link>
        <Link to="/account">Account</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      </div>
      <h1>History</h1>
      {error && <p className="error-text">{error}</p>}
      {!error && !captures && <p>Loading…</p>}
      {captures?.length === 0 && <p>No captures yet.</p>}
      <ul className="history-list">
        {captures?.map((capture) => (
          <li key={capture.id}>
            <div className="history-title">{capture.title || '(untitled)'}</div>
            <div className="history-answer">{capture.answer}</div>
            <div className="history-time">{formatTimestamp(capture.created_at)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default History;
