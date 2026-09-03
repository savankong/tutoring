import { Link } from 'react-router-dom';
import { CAMPAIGN_CATEGORIES, SCHOOL_HUBS } from '../../lib/campaignPages.js';

// "Condensed to categories" per the design brief — each category collapses
// to a row with its page count and expands (native <details>, no JS) into
// the real links on click, in the same flush-divider list treatment as the
// FAQ section. Keeps every campaign-page link crawlable in the
// server-rendered HTML instead of dropping them for a purely decorative row.
function ZineResources() {
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
                <Link key={page.slug} to={`/${page.slug}/`}>
                  {page.label}
                </Link>
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
              <Link key={school.slug} to={`/${school.slug}/`}>
                {school.label}
              </Link>
            ))}
          </div>
        </details>
        <span className="zn-chip-static">Everything else you can photograph</span>
      </div>
    </div>
  );
}

export default ZineResources;
