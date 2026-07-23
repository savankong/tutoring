function humanizeSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function LpRelatedLinks({ content, allContent }) {
  if (!content.internalLinks || content.internalLinks.length === 0) return null;

  return (
    <section className="lp-related-section">
      <div className="section-eyebrow">Related</div>
      <h2>Other practice pages.</h2>
      <div className="lp-related-links">
        {content.internalLinks.map((slug) => {
          const target = allContent[slug];
          return (
            <a className="lp-related-link" href={`/${slug}/`} key={slug}>
              {target ? target.h1 : humanizeSlug(slug)}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default LpRelatedLinks;
