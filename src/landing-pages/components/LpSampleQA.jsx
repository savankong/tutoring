function LpSampleQA({ content }) {
  return (
    <section id="sample-questions" className="lp-sample-section">
      <div className="section-eyebrow">Sample questions</div>
      <h2>A couple of real examples.</h2>
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

export default LpSampleQA;
