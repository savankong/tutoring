function humanizeSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function LpRelatedLinks({ content, allContent }) {
  if (!content.internalLinks || content.internalLinks.length === 0) return null;

  return (
    <section className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}>
          Other practice pages.
        </h2>
      </div>
      <div className="zn-lp-related">
        {content.internalLinks.map((slug) => {
          const target = allContent[slug];
          return (
            <a href={`/${slug}/`} key={slug}>
              {target ? target.h1 : humanizeSlug(slug)}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default LpRelatedLinks;
