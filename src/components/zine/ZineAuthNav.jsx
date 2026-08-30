import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';

// Minimal header for the auth-style pages (Login, Register, Forgot/Reset
// Password, Verify Email) — centered logo doubling as the home link, no nav
// links. Zine equivalent of the old shared AuthNav.
function ZineAuthNav() {
  return (
    <header className="zn-auth-nav">
      <Link to="/" className="zn-auth-nav-logo">
        <Logo size={20} />
        <span className="zn-header-wordmark">Cambo</span>
      </Link>
    </header>
  );
}

export default ZineAuthNav;
