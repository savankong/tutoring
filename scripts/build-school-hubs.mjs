import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchoolHubsContent } from './school-hubs-content.mjs';
import { loadCourseCatalog, coursesForSchool } from './course-catalog-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');

// Same hoisting behavior build-landing-pages.mjs and prerender.mjs rely on —
// see the comment there for the full explanation.
const HEAD_TAG_PREFIX = /^(?:<title>[\s\S]*?<\/title>|<meta[^>]*\/>|<link[^>]*\/>|<script[^>]*><\/script>)+/;

const { renderSchoolHub } = await import(join(rootDir, 'dist-ssr', 'entry-server.js'));

const staticContent = loadSchoolHubsContent(rootDir);
const catalog = loadCourseCatalog(rootDir);

// A hub page's course list and verification date are computed here from
// course-catalog.json, never hand-authored — see HubCourseList.jsx.
const allContent = Object.fromEntries(
  Object.entries(staticContent).map(([slug, content]) => {
    const school = catalog.schools.find((s) => s.key === content.schoolKey);
    return [
      slug,
      {
        ...content,
        courses: coursesForSchool(catalog, content.schoolKey),
        schoolVerifiedAt: school?.verifiedAt,
      },
    ];
  }),
);

const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');
const headBoilerplate = [...baseHtml.matchAll(/^\s*(<(?:meta|link)[^>]*\/?>)\s*$/gm)]
  .map((m) => m[1])
  .filter((tag) => !tag.includes('rel="canonical"') && !/name="(?:description|robots)"/.test(tag) && !tag.includes('property="og:') && !tag.includes('name="twitter:'))
  .join('\n    ');

for (const content of Object.values(allContent)) {
  const { html } = renderSchoolHub(content, allContent);
  const match = html.match(HEAD_TAG_PREFIX);
  const pageHead = match ? match[0] : '';
  const body = match ? html.slice(match[0].length) : html;

  const page = `<!doctype html>
<html lang="en">
  <head>
    ${headBoilerplate}
    ${pageHead}
  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>
`;

  const outPath = join(distDir, content.slug, 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, page);
  console.log(`built school hub /${content.slug}/ -> ${outPath.replace(rootDir + '/', '')}`);
}
