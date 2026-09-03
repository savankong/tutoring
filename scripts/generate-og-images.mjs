import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadLandingPagesContent } from './landing-pages-content.mjs';
import { loadSchoolHubsContent } from './school-hubs-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(rootDir, 'dist', 'og');

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_CHARS_PER_LINE = 22;

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Simple greedy word-wrap — good enough for the short, punchy H1s these
// pages use. Not measuring actual glyph widths, just capping char count.
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg(headline) {
  const lines = wrapText(headline, MAX_CHARS_PER_LINE);
  const lineHeight = 58;
  const headlineStartY = 400;
  const tspans = lines
    .map((line, i) => `<tspan x="${WIDTH / 2}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  return `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#4a1b14" />
      <stop offset="100%" stop-color="#1c1d1f" />
    </radialGradient>
    <radialGradient id="dot" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ff6b5e" />
      <stop offset="100%" stop-color="#d81f0f" />
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
  <g transform="translate(${WIDTH / 2 - 45}, 90)" fill="none" stroke="#f4e2df" stroke-width="7" stroke-linecap="round">
    <path d="M4 30V16a12 12 0 0 1 12-12h16" />
    <path d="M58 4h16a12 12 0 0 1 12 12v14" />
    <path d="M86 58v16a12 12 0 0 1-12 12H58" />
    <path d="M32 86H16A12 12 0 0 1 4 74V58" />
    <circle cx="45" cy="45" r="13" fill="url(#dot)" stroke="none" />
  </g>
  <text x="${WIDTH / 2}" y="230" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="46" font-weight="700" fill="#f4e2df">Cambo</text>
  <text x="${WIDTH / 2}" y="${headlineStartY}" text-anchor="middle" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="42" font-weight="600" fill="#c9beba">${tspans}</text>
</svg>`;
}

mkdirSync(outDir, { recursive: true });

const allContent = { ...loadLandingPagesContent(rootDir), ...loadSchoolHubsContent(rootDir) };
for (const content of Object.values(allContent)) {
  const svg = buildSvg(content.h1);
  const outPath = join(outDir, `${content.slug}.png`);
  await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile(outPath);
  console.log(`generated OG image for ${content.slug} -> ${outPath.replace(rootDir + '/', '')}`);
}
