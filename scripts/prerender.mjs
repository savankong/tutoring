import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');

const PUBLIC_ROUTES = ['/', '/pricing', '/login', '/register', '/terms', '/privacy'];

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree to the
// front of the SSR output, even without a literal <head> in the component
// tree. react-helmet-async's `context` extraction is a pre-React-19 API and
// stays empty here, so we split that hoisted prefix off manually instead.
const HEAD_TAG_PREFIX = /^(?:<title>[\s\S]*?<\/title>|<meta[^>]*\/>|<link[^>]*\/>)+/;

const { render } = await import(join(rootDir, 'dist-ssr', 'entry-server.js'));

const template = readFileSync(join(distDir, 'index.html'), 'utf-8')
  // Route-specific fallbacks get replaced by the hoisted tags below — drop
  // them here so we don't end up with duplicate <title>/description tags.
  .replace(/\s*<title>.*?<\/title>\n/, '\n')
  .replace(/\s*<meta name="description"[^>]*\/>\n/, '\n');

for (const route of PUBLIC_ROUTES) {
  const { html } = render(route);
  const match = html.match(HEAD_TAG_PREFIX);
  const head = match ? match[0] : '';
  const body = match ? html.slice(match[0].length) : html;

  const page = template
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const outPath = route === '/' ? join(distDir, 'index.html') : join(distDir, route.slice(1), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, page);
  console.log(`prerendered ${route} -> ${outPath.replace(rootDir + '/', '')}`);
}

rmSync(join(rootDir, 'dist-ssr'), { recursive: true, force: true });
