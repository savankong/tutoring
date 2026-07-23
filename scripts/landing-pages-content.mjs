import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function loadLandingPagesContent(rootDir) {
  const dir = join(rootDir, 'content', 'landing-pages');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const bySlug = {};
  for (const file of files) {
    const content = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    bySlug[content.slug] = content;
  }
  return bySlug;
}
