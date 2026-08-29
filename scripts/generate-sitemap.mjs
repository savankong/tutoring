import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLandingPagesContent } from './landing-pages-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE_URL = 'https://camboapp.com';

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/pricing/', priority: '0.8' },
  { path: '/terms/', priority: '0.3' },
  { path: '/privacy/', priority: '0.3' },
];

const allContent = loadLandingPagesContent(rootDir);
const landingRoutes = Object.values(allContent).map((content) => ({
  path: `/${content.slug}/`,
  priority: '0.9',
}));

const routes = [...STATIC_ROUTES, ...landingRoutes];

const urls = routes
  .map(
    ({ path, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(rootDir, 'dist', 'sitemap.xml'), sitemap);
console.log(`generated sitemap.xml with ${routes.length} URLs`);
