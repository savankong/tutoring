import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthNav from '../components/AuthNav.jsx';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import { submitNetlifyForm } from '../lib/netlifyForms.js';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitNetlifyForm('question', { name, email, question });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact — Cambo App"
        description="Have a question about Cambo App? Ask us."
        path="/contact"
        noindex
      />
      <AuthNav />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-logo">
            <Logo size={18} wordmark />
          </div>
          <h1>Have a question?</h1>
          {sent ? (
            <p className="auth-subhead">Thanks — we'll get back to you at {email}.</p>
          ) : (
            <>
              <p className="auth-subhead">Ask us anything about Cambo App before you sign up.</p>
              <form onSubmit={onSubmit} className="auth-form">
                <label>
                  <span className="auth-label">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span className="auth-label">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  <span className="auth-label">Question</span>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    rows={5}
                  />
                </label>
                {error && <p className="error-text">{error}</p>}
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send question'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="auth-switch">
          <Link to="/login">Already have an account? Log in</Link>
        </p>
      </div>
    </>
  );
}

export default Contact;
