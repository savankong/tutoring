import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../lib/AuthContext.jsx';
import Logo from '../components/Logo.jsx';

function formatTimestamp(iso) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Local YYYY-MM-DD (not toISOString, which shifts to UTC and can land on
// the wrong day depending on the tutor's timezone) so date inputs and the
// captures they're filtering agree on what "today" means.
function toDateInputValue(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function History() {
  const { user } = useAuthContext();
  const [captures, setCaptures] = useState(null);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetch('/api/history', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load history.');
        setCaptures(data.captures);
      })
      .catch((err) => setError(err.message));
  }, []);

  const hasFilter = fromDate || toDate;
  const filteredCaptures = captures?.filter((capture) => {
    const takenOn = toDateInputValue(new Date(capture.created_at));
    if (fromDate && takenOn < fromDate) return false;
    if (toDate && takenOn > toDate) return false;
    return true;
  });

  return (
    <div className="App">
      <div className="top-nav">
        <Link to="/app">Capture</Link>
        <Link to="/account">Account</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
      </div>
      <h1>
        <Logo size={26} wordmark />
      </h1>
      <h2 className="page-title">History</h2>
      {error && <p className="error-text">{error}</p>}

      {captures && captures.length > 0 && (
        <div className="history-filter">
          <label>
            <span className="history-filter-label">From</span>
            <input type="date" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            <span className="history-filter-label">To</span>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
          </label>
          {hasFilter && (
            <button
              type="button"
              className="secondary history-filter-clear"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {!error && !captures && <p>Loading…</p>}
      {captures?.length === 0 && <p>No captures yet.</p>}
      {captures?.length > 0 && filteredCaptures.length === 0 && <p>No captures taken in that date range.</p>}
      <ul className="history-list">
        {filteredCaptures?.map((capture) => (
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
