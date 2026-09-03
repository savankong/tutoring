import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLandingPagesContent } from './landing-pages-content.mjs';
import { fetchPublicQuestionsBySlug } from './fetch-public-questions.mjs';
import { normalizeQuestionKey } from '../netlify/lib/publicTopics.js';
import { loadCourseCatalog, schoolCodesForCourse } from './course-catalog-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');

// Hard cap so a topic with thousands of accumulated real questions doesn't
// balloon page weight or JSON-LD size — curated static questions always
// make the cut; real ones fill remaining slots by popularity (times_seen).
const MAX_QUESTIONS_PER_PAGE = 40;

function mergeRealQuestions(content, realQuestions) {
  if (!realQuestions?.length) return content;
  const merged = [...content.sampleQuestions];
  const seenKeys = new Set(merged.map((q) => normalizeQuestionKey(q.q)));
  for (const row of realQuestions) {
    if (merged.length >= MAX_QUESTIONS_PER_PAGE) break;
    const key = normalizeQuestionKey(row.question);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    merged.push({ q: row.question, a: row.answer });
  }
  return { ...content, sampleQuestions: merged };
}

// Same hoisting behavior as scripts/prerender.mjs relies on: React 19 lifts
// <title>/<meta>/<link> rendered anywhere in the tree to the front of the
// renderToStaticMarkup output. Empty <script async src="..."></script> tags
// (no body content — e.g. the Plausible loader) get hoisted into the same
// prefix as a "Resource". Scripts WITH body content (the JSON-LD block, the
// inline Plausible init snippet) are not treated as Resources and stay
// inline in the body, which is fine — they work wherever they land.
const HEAD_TAG_PREFIX = /^(?:<title>[\s\S]*?<\/title>|<meta[^>]*\/>|<link[^>]*\/>|<script[^>]*><\/script>)+/;

const { renderLandingPage } = await import(join(rootDir, 'dist-ssr', 'entry-server.js'));

const staticContent = loadLandingPagesContent(rootDir);
const realQuestionsBySlug = await fetchPublicQuestionsBySlug();
const catalog = loadCourseCatalog(rootDir);

// A Big 12 course page (content.courseKey set) gets its "also known as"
// section computed here from course-catalog.json rather than hand-authored
// — see LpSchoolCodes.jsx. Every other page's courseKey is undefined, so
// schoolCodes stays empty and that section renders nothing.
function withSchoolCodes(content) {
  if (!content.courseKey) return content;
  return { ...content, schoolCodes: schoolCodesForCourse(catalog, content.courseKey) };
}

const allContent = Object.fromEntries(
  Object.entries(staticContent).map(([slug, content]) => [
    slug,
    withSchoolCodes(mergeRealQuestions(content, realQuestionsBySlug[slug])),
  ]),
);

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
