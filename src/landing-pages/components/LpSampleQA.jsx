const FC_ICON_PATHS = {
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
};

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

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
// renderToStaticMarkup with zero client JS — see the LpSampleQA note in
// CLAUDE.md. Radios pick the visible card; <details> drives the flip.
//
// Both faces live inside <summary> so that a click anywhere on the card
// toggles it — only <summary> flips a <details>, and once the card is
// showing its back face there'd otherwise be nothing clickable to flip it
// back. The card is a fixed height so the arrows never shift position.
//
// `options`/`correct` are optional per question so a content file that hasn't
// been given multiple choice yet still renders as a plain Q&A card.
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
              <summary className="fc-flip">
                <div className="fc-face fc-front">
                  <h3 className="fc-question">{sample.q}</h3>
                  {sample.options && (
                    <ol className="fc-options">
                      {sample.options.map((opt, oi) => (
                        <li className="fc-option" key={opt}>
                          <span className="fc-option-letter">{CHOICE_LETTERS[oi]}</span>
                          <span className="fc-option-text">{opt}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="fc-tap-cue">Tap the card to reveal the answer</div>
                </div>
                <div className="fc-face fc-back">
                  <span className="lp-sample-a-label">Answer</span>
                  {sample.options && (
                    <div className="fc-correct">
                      <span className="fc-option-letter fc-option-letter-correct">
                        {CHOICE_LETTERS[sample.correct]}
                      </span>
                      <span>{sample.options[sample.correct]}</span>
                    </div>
                  )}
                  <div className="fc-answer">{sample.a}</div>
                </div>
              </summary>
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
// Google retired the practice-problem rich result in Jan 2026, so this is
// here for machine-readable comprehension rather than a SERP feature: the
// distractors go in suggestedAnswer, the key in acceptedAnswer, and the
// existing prose explanation rides along as the answer's comment.
export function quizSchema(content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: content.h1,
    description: content.metaDescription,
    about: { '@type': 'Thing', name: content.h1 },
    educationalLevel: 'Adult Education',
    hasPart: content.sampleQuestions.map((q) => {
      if (!q.options) {
        return {
          '@type': 'Question',
          eduQuestionType: 'Flashcard',
          name: q.q,
          text: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a },
        };
      }
      return {
        '@type': 'Question',
        eduQuestionType: 'Multiple choice',
        name: q.q,
        text: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.options[q.correct],
          comment: { '@type': 'Comment', text: q.a },
        },
        suggestedAnswer: q.options
          .map((opt, i) => ({ opt, i }))
          .filter(({ i }) => i !== q.correct)
          .map(({ opt }) => ({ '@type': 'Answer', text: opt })),
      };
    }),
  };
}

export default LpSampleQA;
