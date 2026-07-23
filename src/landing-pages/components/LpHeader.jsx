import Logo from '../../components/Logo.jsx';

function LpHeader() {
  return (
    <nav className="site-nav lp-nav">
      <a className="site-nav-logo" href="/">
        <Logo size={20} wordmark />
      </a>
      <span />
      <div className="site-nav-actions">
        <a href="/login" className="pill-button pill-button-sm pill-button-outline">
          Log in
        </a>
        <a href="/register" className="pill-button pill-button-sm">
          Try it free
        </a>
      </div>
    </nav>
  );
}

export default LpHeader;
