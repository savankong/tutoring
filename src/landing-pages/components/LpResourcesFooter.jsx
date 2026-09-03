import { CAMPAIGN_CATEGORIES, SCHOOL_HUBS } from '../../lib/campaignPages.js';

// Plain <a> tags, not <Link> — landing pages render via renderToStaticMarkup
// with no React Router context, so react-router-dom's Link would throw.
// Same "condensed to categories" flush-divider list treatment as the
// homepage's <ZineResources>, just with plain anchors instead of Link for
// that reason.
function LpResourcesFooter() {
  return (
    <div id="resources" className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}>
          Example quizzes that you are forced to take
        </h2>
      </div>
      <div className="zn-chip-row">
        {CAMPAIGN_CATEGORIES.map((category) => (
          <details className="zn-chip" key={category.title}>
            <summary>
              <span>
                {category.title} <span className="zn-chip-count">{category.pages.length}</span>
              </span>
              <span className="zn-plus">+</span>
            </summary>
            <div className="zn-chip-panel">
              {category.pages.map((page) => (
                <a key={page.slug} href={`/${page.slug}/`}>
                  {page.label}
                </a>
              ))}
            </div>
          </details>
        ))}
        <details className="zn-chip">
          <summary>
            <span>
              Campus Study Hubs <span className="zn-chip-count">{SCHOOL_HUBS.length}</span>
            </span>
            <span className="zn-plus">+</span>
          </summary>
          <div className="zn-chip-panel">
            {SCHOOL_HUBS.map((school) => (
              <a key={school.slug} href={`/${school.slug}/`}>
                {school.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

export default LpResourcesFooter;
