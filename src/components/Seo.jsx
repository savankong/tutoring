import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://camboapp.com';

function Seo({ title, description, path = '/', noindex = false, children }) {
  const url = `${SITE_URL}${path}`;

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
