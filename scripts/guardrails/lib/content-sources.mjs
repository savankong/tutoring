import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Shared by every guardrail check. Unlike scripts/landing-pages-content.mjs
// and scripts/school-hubs-content.mjs (which index by declared `slug` and
// silently let a duplicate slug overwrite an earlier entry in the returned
// object), this keeps one row per file so check-schema.mjs can actually
// catch a duplicate or filename-mismatched slug instead of losing it to an
// object-key collision.
export function loadContentFiles(rootDir, subdir) {
  const dir = join(rootDir, 'content', subdir);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      file,
      dir: subdir,
      relPath: join('content', subdir, file),
      path: join(dir, file),
      content: JSON.parse(readFileSync(join(dir, file), 'utf-8')),
    }));
}

export function loadAllContent(rootDir) {
  return [...loadContentFiles(rootDir, 'landing-pages'), ...loadContentFiles(rootDir, 'school-hubs')];
}
