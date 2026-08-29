import { useEffect, useState } from 'react';

// Catches any URL the client-side router doesn't recognize — chiefly the
// static SEO landing pages, which only exist as prerendered HTML files, not
// client routes. If the SPA shell ever loads for one of these (a stale
// response mid-deploy, a redirect race, etc.), <Routes> would otherwise
// render nothing. Forcing a real navigation re-requests the exact URL from
// the network, letting the host serve the actual static file.
// Guarded by a sessionStorage flag so a persistent (non-transient) failure
// shows a real fallback instead of reloading forever.
function HardReloadFallback() {
  const [retried, setRetried] = useState(true);

  useEffect(() => {
    const key = `hard-reload:${window.location.pathname}`;
    if (sessionStorage.getItem(key)) {
      setRetried(false);
      return;
    }
    sessionStorage.setItem(key, '1');
    window.location.replace(window.location.pathname + window.location.search + window.location.hash);
  }, []);

  if (retried) return null;

  return (
    <div className="auth-loading">
      <p>
        Page not found. <a href="/">Go home</a>
      </p>
    </div>
  );
}

export default HardReloadFallback;
