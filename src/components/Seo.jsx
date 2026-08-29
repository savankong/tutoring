import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://camboapp.com';

function Seo({ title, description, path = '/', noindex = false, children }) {
  // The static host 301s "/pricing" -> "/pricing/" for a prerendered
  // directory (express.static's default trailing-slash redirect on DO,
  // same as Netlify's pretty-URL resolution before it) — point canonical/OG
  // URLs straight at the trailing-slash form that actually serves 200, so
  // crawlers don't take an extra redirect hop.
  const normalizedPath = path === '/' ? '/' : `${path.replace(/\/$/, '')}/`;
  const url = `${SITE_URL}${normalizedPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {children}
    </Helmet>
  );
}

export default Seo;
