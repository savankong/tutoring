import Logo from '../Logo.jsx';

const NAV_ITEMS = [
  { label: 'How it works', href: '/#how' },
  { label: 'Why', href: '/#why' },
  { label: "Who it's for", href: '/#who' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/#faq' },
];

// Top-nav header for the zine redesign — intentionally its own component
// rather than a reskin of the shared <Sidebar>, since Sidebar also backs
// the 24 SEO campaign pages and the rest of the app shell, none of which
// are part of this redesign.
function ZineHeader({ user }) {
  return (
    <header className="zn-header">
      <a href="/" className="zn-header-brand">
        <Logo size={26} />
        <span className="zn-header-wordmark">Cambo</span>
        <span className="zn-header-dot" />
      </a>
      <nav className="zn-nav">
        <div className="zn-nav-links">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        {user ? (
          <>
            <a href="/account" className="zn-nav-outline">
              Account
            </a>
            <a href="/app" className="zn-nav-cta">
              Go to app
            </a>
          </>
        ) : (
          <a href="/register" className="zn-nav-cta">
            Sign up free
          </a>
        )}
      </nav>
    </header>
  );
}

export default ZineHeader;
