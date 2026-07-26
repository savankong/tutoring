// Generates social copy (X, LinkedIn, Reddit, video caption) for one or more
// campaign landing pages, using each page's own JSON content as the source
// material. Run manually — not part of the site build, since it costs an
// API call per page and produces content for a human to review before
// posting, not something to publish automatically.
//
// Usage:
//   node scripts/generate-social-content.mjs <slug> [<slug> ...]
//   node scripts/generate-social-content.mjs --all
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { loadLandingPagesContent } from './landing-pages-content.mjs';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(rootDir, 'content', 'social-posts');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const SYSTEM_PROMPT = [
  'You write short-form social copy for Cambo, a camera-based practice-question app (camboapp.com).',
  'Voice: direct, no hype, no emojis unless natural.',
  'Never claim affiliation with the official test/certification body.',
  'Never imply you have real exam questions — sample questions are original practice items only.',
].join(' ');

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    x_post: {
      type: 'string',
      description:
        'Under 280 characters. Hooks on the pain point from whyItWorks. No hashtag spam (max 1 hashtag). Must include the campaign link.',
    },
    linkedin_post: {
      type: 'string',
      description:
        '2-3 short paragraphs, professional but human, ends with a soft CTA. Must include the campaign link.',
    },
    reddit_post_title: {
      type: 'string',
      description:
        'Written as if genuinely sharing a tool that helped, not an ad headline.',
    },
    reddit_post_body: {
      type: 'string',
      description:
        'Written as if genuinely sharing a tool that helped, not an ad. Discloses that this is the poster\'s own product (posting as the maker). Must include the campaign link.',
    },
    video_caption: {
      type: 'string',
      description:
        'One line, for a screen-recording clip of the app, plus 3-5 relevant hashtags.',
    },
  },
  required: ['x_post', 'linkedin_post', 'reddit_post_title', 'reddit_post_body', 'video_caption'],
  additionalProperties: false,
};

function campaignLink(slug) {
  return `https://camboapp.com/${slug}?ref=social-${slug}`;
}

function buildUserPrompt(content, link) {
  return [
    'Here is a landing page JSON for one campaign:',
    JSON.stringify(content, null, 2),
    '',
    'Generate the 4 outputs per your instructions.',
    `Every output must link to exactly this URL: ${link}`,
  ].join('\n');
}

// Belt-and-suspenders: never ship a variant missing its attribution link,
// even if the model drops or mistypes it.
function ensureLink(text, link) {
  return text.includes(link) ? text : `${text}\n\n${link}`;
}

async function generateForSlug(slug, content) {
  const link = campaignLink(slug);

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(content, link) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude declined to generate social copy for "${slug}"`);
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) {
    throw new Error(`No text content in Claude response for "${slug}"`);
  }

  const parsed = JSON.parse(textBlock.text);
  return {
    slug,
    link,
    x_post: ensureLink(parsed.x_post, link),
    linkedin_post: ensureLink(parsed.linkedin_post, link),
    reddit_post_title: parsed.reddit_post_title,
    reddit_post_body: ensureLink(parsed.reddit_post_body, link),
    video_caption: parsed.video_caption,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const requested = args.filter((a) => !a.startsWith('--'));

  const allContent = loadLandingPagesContent(rootDir);
  const targets = all ? Object.keys(allContent) : requested;

  if (targets.length === 0) {
    console.error('Usage: node scripts/generate-social-content.mjs <slug> [<slug> ...] | --all');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  for (const slug of targets) {
    const content = allContent[slug];
    if (!content) {
      console.error(`No landing page content found for slug "${slug}" — skipping`);
      continue;
    }
    console.log(`Generating social content for ${slug}...`);
    const result = await generateForSlug(slug, content);
    const outPath = join(outDir, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`  -> wrote ${outPath.replace(rootDir + '/', '')}`);
  }

  console.log('\nGenerated. What to do with each field:');
  console.log('  - x_post / linkedin_post: queue to Buffer once BUFFER_ACCESS_TOKEN is configured (not wired up yet — no Buffer credentials exist in this project).');
  console.log('  - reddit_post_title / reddit_post_body: post manually from a real account. Scripted Reddit posting reads as spam and risks a shadowban.');
  console.log('  - video_caption: burn onto the matching screen-recording clip with ffmpeg (no video-recording pipeline exists yet — out of scope here).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
