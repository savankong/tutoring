import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLandingPagesContent } from './landing-pages-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');

// Same hoisting behavior as scripts/prerender.mjs relies on: React 19 lifts
// <title>/<meta>/<link> rendered anywhere in the tree to the front of the
// renderToStaticMarkup output. Empty <script async src="..."></script> tags
// (no body content — e.g. the Plausible loader) get hoisted into the same
// prefix as a "Resource". Scripts WITH body content (the JSON-LD block, the
// inline Plausible init snippet) are not treated as Resources and stay
// inline in the body, which is fine — they work wherever they land.
const HEAD_TAG_PREFIX = /^(?:<title>[\s\S]*?<\/title>|<meta[^>]*\/>|<link[^>]*\/>|<script[^>]*><\/script>)+/;

const { renderLandingPage } = await import(join(rootDir, 'dist-ssr', 'entry-server.js'));

const allContent = loadLandingPagesContent(rootDir);

// Pull the boilerplate shared with every other page (charset, viewport,
// favicon, manifest, theme-color, compiled stylesheet link) straight out of
// the client build's index.html — same asset hashes, one source of truth.
// No client bundle <script> is carried over: landing pages never hydrate.
const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');
const headBoilerplate = [...baseHtml.matchAll(/^\s*(<(?:meta|link)[^>]*\/?>)\s*$/gm)]
  .map((m) => m[1])
  .filter((tag) => !tag.includes('rel="canonical"') && !/name="(?:description|robots)"/.test(tag) && !tag.includes('property="og:') && !tag.includes('name="twitter:'))
  .join('\n    ');

for (const content of Object.values(allContent)) {
  const { html } = renderLandingPage(content, allContent);
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
  console.log(`built landing page /${content.slug}/ -> ${outPath.replace(rootDir + '/', '')}`);
}
