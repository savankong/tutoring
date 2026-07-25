import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

// Shared header for the auth-style pages (Login, Register, Contact, etc.) —
// centered logo doubling as the home link, no separate "back" text link.
function AuthNav() {
  return (
    <nav className="auth-nav">
      <Link to="/" className="auth-nav-logo">
        <Logo size={20} wordmark />
      </Link>
    </nav>
  );
}

export default AuthNav;
