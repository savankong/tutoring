function LpHero({ content }) {
  const sample = content.sampleQuestions[0];

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="landing-eyebrow">Built for live study sessions</div>
        <h1>{content.h1}</h1>
        <p>{content.subhead}</p>
        <div className="hero-cta-row">
          <a
            href={`/register?ref=${content.slug}`}
            className="pill-button pill-button-lg"
            event-name="CTA Click"
            event-slug={content.slug}
            event-location="hero"
          >
            Try it free
          </a>
          <span className="hero-microcopy">Free forever · no card required</span>
        </div>
      </div>

      <div className="mockup-col">
        <div className="mockup-glow" />
        <div className="phone-frame lp-phone-frame">
          <div className="phone-inner">
            <div className="phone-notch" />
            <div className="phone-app-header">
              <span>📷 Cambo</span>
            </div>
            <div className="phone-main-view">
              <div className="phone-answer-card">
                <div className="phone-question-label" style={{ color: 'rgba(29,29,31,0.4)', marginBottom: 6 }}>
                  QUESTION
                </div>
                <div className="phone-question-text" style={{ color: '#1d1d1f' }}>
                  {sample.q}
                </div>
              </div>
              <div className="phone-answer-heading">Answer</div>
              <div className="phone-answer-body">{sample.a}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LpHero;
