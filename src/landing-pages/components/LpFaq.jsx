function LpFaq({ content }) {
  return (
    <section id="faq" className="faq-section lp-faq-section">
      <div className="section-eyebrow">FAQ</div>
      <h2>Questions, answered.</h2>
      <div className="faq-list">
        {content.faqs.map((faq, i) => (
          <details className="faq-item lp-faq-item" key={faq.q} open={i === 0}>
            <summary className="faq-question-row">
              <span className="faq-question-text">{faq.q}</span>
            </summary>
            <div className="faq-answer">{faq.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function faqSchema(content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export default LpFaq;
