import Logo from './Logo.jsx';

// Shared marketing nav — a fixed left sidebar on desktop that reflows into
// a plain top bar on mobile via CSS alone (no JS), so the exact same
// component works whether hydrated (Landing, Pricing) or fully static,
// zero-JS campaign pages (LpHeader). Plain <a> tags throughout for the
// same reason — a full page load is fine here, and it keeps this component
// usable in both contexts without a react-router dependency. `user` is
// optional — hydrated pages pass it from useAuthContext() for the
// logged-in state; the static campaign pages omit it and always render
// logged-out, since they have no auth context to read.
function Sidebar({ navItems, user }) {
  return (
    <nav className="mkt-sidebar">
      <a href="/" className="mkt-sidebar-logo">
        <Logo size={22} wordmark />
      </a>

      {navItems && navItems.length > 0 && (
        <>
          <div className="mkt-sidebar-label">Navigate</div>
          <div className="mkt-sidebar-links">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="mkt-sidebar-link">
                <span className="mkt-sidebar-dot" />
                {item.label}
              </a>
            ))}
          </div>
        </>
      )}

      <div className="mkt-sidebar-spacer" />

      <div className="mkt-sidebar-auth">
        {user ? (
          <>
            <a href="/account" className="pill-button pill-button-sm pill-button-outline">
              Account
            </a>
            <a href="/app" className="pill-button pill-button-sm">
              Go to app
            </a>
          </>
        ) : (
          <>
            <a href="/contact" className="mkt-sidebar-contact-link">
              Have a question?
            </a>
            <a href="/login" className="pill-button pill-button-sm pill-button-outline">
              Log in
            </a>
            <a href="/register" className="pill-button pill-button-sm">
              Sign up free
            </a>
          </>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
