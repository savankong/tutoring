function LpWhyItWorks({ content }) {
  return (
    <section className="why-section lp-why-section">
      <div className="why-inner">
        <div className="section-eyebrow">Why it works</div>
        <h2>Built for exactly this kind of question.</h2>
        <p className="lp-why-body">{content.whyItWorks}</p>
      </div>
    </section>
  );
}

export default LpWhyItWorks;
