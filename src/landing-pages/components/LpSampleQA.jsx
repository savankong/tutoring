const FC_ICON_PATHS = {
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  sound: (
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>
  ),
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
};

function FcIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {FC_ICON_PATHS[name]}
    </svg>
  );
}

// Flashcard deck for the sample questions. Built with radio inputs + CSS
// sibling selectors (not React state) because these landing pages render via
// renderToStaticMarkup with zero client JS — see LpSampleQA note in
// CLAUDE.md. Prev/next and card flip both work natively: radios drive which
// card is visible, and <details>/<summary> (same pattern as LpFaq) reveals
// the answer. Star/sound icons are visual-only — real bookmarking or
// text-to-speech would need JS this page doesn't ship.
function LpSampleQA({ content }) {
  const total = content.sampleQuestions.length;

  return (
    <section id="sample-questions" className="lp-sample-section">
      <div className="section-eyebrow">Practice quiz</div>
      <h2>Test yourself with real practice questions.</h2>
      <div className="lp-flashcard">
        {content.sampleQuestions.map((_, i) => (
          <input
            type="radio"
            name={`fc-${content.slug}`}
            id={`fc-${content.slug}-${i}`}
            className="fc-radio"
            defaultChecked={i === 0}
            key={i}
          />
        ))}

        <div className="fc-stage">
          {content.sampleQuestions.map((sample) => (
            <details className="fc-card" key={sample.q}>
              <summary className="fc-front">
                <div className="fc-toolbar">
                  <span className="fc-hint">
                    <FcIcon name="pin" />
                    Get a hint
                  </span>
                  <span className="fc-icons">
                    <FcIcon name="sound" />
                    <FcIcon name="star" />
                  </span>
                </div>
                <div className="fc-question">{sample.q}</div>
                <div className="fc-tap-cue">Tap the card to reveal the answer</div>
              </summary>
              <div className="fc-back">
                <span className="lp-sample-a-label">Answer</span>
                <div className="fc-answer">{sample.a}</div>
              </div>
            </details>
          ))}
        </div>

        <div className="fc-controls">
          {content.sampleQuestions.map((_, i) => (
            <div className="fc-controls-row" key={i}>
              <label
                htmlFor={`fc-${content.slug}-${(i - 1 + total) % total}`}
                className="fc-arrow"
                aria-label="Previous question"
              >
                <FcIcon name="chevronLeft" />
              </label>
              <span className="fc-counter">
                {i + 1} / {total}
              </span>
              <label
                htmlFor={`fc-${content.slug}-${(i + 1) % total}`}
                className="fc-arrow"
                aria-label="Next question"
              >
                <FcIcon name="chevronRight" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Schema.org Quiz — signals to search engines that this page IS a quiz/
// practice-test resource, not just an article that mentions the topic.
export function quizSchema(content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: content.h1,
    description: content.metaDescription,
    about: { '@type': 'Thing', name: content.h1 },
    educationalLevel: 'Adult Education',
    hasPart: content.sampleQuestions.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  };
}

export default LpSampleQA;
