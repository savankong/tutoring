-- Turns real captured questions into public, SEO-indexable content on the
-- matching landing page. A capture is only eligible when the capturing
-- user signed up via a campaign page (users.signup_ref matches one of the
-- known landing-page slugs) and hasn't opted out — see analyze-question.js.
--
-- Deduplicated per (topic_slug, normalized question) so the same question
-- asked by many tutors increments times_seen instead of creating
-- duplicate rows; times_seen doubles as a popularity signal for sort
-- order when a page renders these. `published` is the admin unpublish
-- safety net (e.g. a copyright complaint on a commercial-assessment
-- question) — set to false rather than deleting, so it can be reversed.
CREATE TABLE public_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_slug TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  why_others_wrong TEXT,
  normalized_key TEXT NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  published BOOLEAN NOT NULL DEFAULT true,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX public_questions_topic_key_idx ON public_questions (topic_slug, normalized_key);
CREATE INDEX public_questions_topic_published_idx ON public_questions (topic_slug, published, times_seen DESC);

-- Opted in by default (growth-first per product decision) — a user can
-- flip this in Account settings to exclude their future captures.
ALTER TABLE users ADD COLUMN public_captures_opt_out BOOLEAN NOT NULL DEFAULT false;

-- The verbatim (or near-verbatim) question text as read from the photo —
-- previously only a short 3-6 word `title` label was captured, which
-- isn't usable as actual quiz content. Needed to populate public_questions.
ALTER TABLE captures ADD COLUMN question_text TEXT;
