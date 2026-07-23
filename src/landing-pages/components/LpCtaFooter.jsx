function LpCtaFooter({ content }) {
  return (
    <section className="footer-cta-section lp-cta-footer">
      <h2>Ready to stop getting stuck on questions?</h2>
      <a
        href={`/register?ref=${content.slug}`}
        className="pill-button pill-button-lg"
        event-name="CTA Click"
        event-slug={content.slug}
        event-location="footer"
      >
        Try it free
      </a>
      <div className="hero-microcopy">Free forever · no card required</div>
    </section>
  );
}

export default LpCtaFooter;
