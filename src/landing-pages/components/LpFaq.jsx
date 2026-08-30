function LpFaq({ content }) {
  return (
    <section id="faq" className="zn-section">
      <h2 className="zn-h2" style={{ marginBottom: 'clamp(24px, 3vw, 38px)' }}>
        Questions, answered.
      </h2>
      <div className="zn-faq-list">
        {content.faqs.map((faq, i) => (
          <details className="zn-faq-item" key={faq.q} open={i === 0}>
            <summary>
              {faq.q}
              <span className="zn-plus">+</span>
            </summary>
            <p>{faq.a}</p>
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
