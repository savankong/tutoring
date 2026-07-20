import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

function SiteNav() {
  return (
    <nav className="site-nav">
      <Link to="/" className="site-nav-logo">
        <Logo size={20} wordmark />
      </Link>
      <div className="site-nav-center-links">
        <Link to="/#how">How it works</Link>
        <Link to="/#why">Why tutors</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/#faq">FAQ</Link>
      </div>
      <div className="site-nav-actions">
        <Link to="/login" className="pill-button pill-button-sm pill-button-outline">
          Log in
        </Link>
        <Link to="/register" className="pill-button pill-button-sm">
          Sign up free
        </Link>
      </div>
    </nav>
  );
}

export default SiteNav;
