// The 24 landing-page slugs eligible to receive auto-published captured
// questions. Mirrors src/lib/campaignPages.js — kept as a separate backend
// constant rather than importing that frontend file, matching this repo's
// existing plans.js pattern of not crossing the client/server boundary.
export const PUBLIC_QUESTION_TOPICS = new Set([
  'dod-cyber-awareness-challenge',
  'opsec-training',
  'information-assurance-training',
  'anti-terrorism-level-1-training',
  'combating-trafficking-in-persons-training',
  'cui-training',
  'pii-training',
  'insider-threat-awareness-training',
  'tarp-training',
  'law-of-war-training',
  'sere-100-2-training',
  'hipaa-training',
  'sexual-harassment-prevention-training',
  'active-shooter-training',
  'osha-10-hour-training',
  'anti-money-laundering-training',
  'ccat-practice-test',
  'wonderlic-test-practice',
  'predictive-index-cognitive-assessment',
  'shl-test-practice',
  'caliper-assessment-practice',
  'hogan-assessment-practice',
  'asvab-practice-test',
  'pmp-exam-practice',
]);

// Collapse whitespace/case/trailing punctuation so the same question typed
// or photographed slightly differently still dedupes to one row.
export function normalizeQuestionKey(question) {
  return question
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?.!,;:'"]+$/g, '');
}
