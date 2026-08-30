function LpHero({ content }) {
  return (
    <section className="zn-lp-hero">
      <h1>{content.h1}</h1>
      <p>{content.subhead}</p>
      <a
        href={`/register?ref=${content.slug}`}
        className="zn-btn"
        event-name="CTA Click"
        event-slug={content.slug}
        event-location="hero"
      >
        Try it free
      </a>
      <span className="zn-lp-microcopy">Free forever · no card required</span>
    </section>
  );
}

export default LpHero;
