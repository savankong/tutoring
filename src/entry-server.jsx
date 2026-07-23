import { StrictMode } from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext.jsx';
import App from './App.jsx';
import LandingPageTemplate from './landing-pages/LandingPageTemplate.jsx';

export function render(url) {
  const helmetContext = {};
  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </StaticRouter>
      </HelmetProvider>
    </StrictMode>,
  );
  return { html, helmet: helmetContext.helmet };
}

// Landing pages ship as fully static HTML — no hydration, no client bundle,
// no React Router/Auth context needed. renderToStaticMarkup (not
// renderToString) so there's no data-reactroot/hydration bookkeeping in the
// output, since a client React tree will never attach to it.
export function renderLandingPage(content, allContent) {
  const html = renderToStaticMarkup(
    <StrictMode>
      <LandingPageTemplate content={content} allContent={allContent} />
    </StrictMode>,
  );
  return { html };
}
