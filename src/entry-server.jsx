import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './lib/AuthContext.jsx';
import App from './App.jsx';

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
