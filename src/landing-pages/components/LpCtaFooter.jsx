function LpCtaFooter({ content }) {
  return (
    <section className="zn-footer-cta">
      <h2>Ready to stop getting stuck on questions?</h2>
      <a
        href={`/register?ref=${content.slug}`}
        className="zn-btn"
        event-name="CTA Click"
        event-slug={content.slug}
        event-location="footer"
      >
        Try it free
      </a>
    </section>
  );
}

export default LpCtaFooter;
