function LpSampleQA({ content }) {
  return (
    <section id="sample-questions" className="lp-sample-section">
      <div className="section-eyebrow">Practice quiz</div>
      <h2>Test yourself with real practice questions.</h2>
      <div className="lp-sample-grid">
        {content.sampleQuestions.map((sample) => (
          <div className="lp-sample-card" key={sample.q}>
            <div className="lp-sample-q">{sample.q}</div>
            <div className="lp-sample-a">
              <span className="lp-sample-a-label">Answer</span>
              {sample.a}
            </div>
          </div>
        ))}
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
