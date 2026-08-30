import Logo from '../Logo.jsx';

const DEFAULT_NAV_ITEMS = [
  { label: 'How it works', href: '/#how' },
  { label: 'Why', href: '/#why' },
  { label: "Who it's for", href: '/#who' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

// Top-nav header for the zine redesign — used by every zine-themed page
// (homepage, pricing, legal pages, auth pages, the 24 SEO campaign pages).
// Plain <a> tags throughout (not react-router's <Link>) so it also works
// unmodified on the campaign pages, which render via renderToStaticMarkup
// with no router context and zero client JS.
// `navItems` lets a page swap the link set (the campaign pages point at
// their own on-page sections instead of the homepage's). `user` is optional
// — hydrated pages pass it from useAuthContext() for the logged-in state;
// pages with no auth context (the campaign pages) omit it and always render
// logged-out.
//
// Mobile menu is a checkbox-hack dropdown (hidden checkbox + label, toggled
// via CSS :checked, no JS) rather than React state — same reason as the
// plain <a> tags: this component has to work identically on zero-JS pages.
function ZineHeader({ user, navItems = DEFAULT_NAV_ITEMS }) {
  return (
    <header className="zn-header">
      <a href="/" className="zn-header-brand">
        <Logo size={26} />
        <span className="zn-header-wordmark">Cambo</span>
        <span className="zn-header-dot" />
      </a>

      <input type="checkbox" id="zn-menu-toggle" className="zn-menu-toggle" />

      <div className="zn-header-right">
        {user ? (
          <a href="/app" className="zn-nav-cta zn-nav-cta-mobile">
            Go to app
          </a>
        ) : (
          <a href="/register" className="zn-nav-cta zn-nav-cta-mobile">
            Sign up free
          </a>
        )}
        <label htmlFor="zn-menu-toggle" className="zn-menu-btn" aria-label="Menu">
          <span />
          <span />
          <span />
        </label>
      </div>

      <nav className="zn-nav">
        <div className="zn-nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          {user && (
            <a href="/account" className="zn-nav-links-account">
              Account
            </a>
          )}
        </div>
        {user ? (
          <>
            <a href="/account" className="zn-nav-outline zn-nav-desktop-only">
              Account
            </a>
            <a href="/app" className="zn-nav-cta zn-nav-desktop-only">
              Go to app
            </a>
          </>
        ) : (
          <a href="/register" className="zn-nav-cta zn-nav-desktop-only">
            Sign up free
          </a>
        )}
      </nav>
    </header>
  );
}

export default ZineHeader;
