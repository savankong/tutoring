import { Link } from 'react-router-dom';
import { CAMPAIGN_CATEGORIES } from '../../lib/campaignPages.js';

// "Condensed to categories" per the design brief — each category collapses
// to a chip with its page count and expands (native <details>, no JS) into
// the real links on click. Keeps every campaign-page link crawlable in the
// server-rendered HTML instead of dropping them for a purely decorative chip.
function ZineResources() {
  return (
    <div id="resources" className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}>
          What people point it at
        </h2>
      </div>
      <div className="zn-chip-row">
        {CAMPAIGN_CATEGORIES.map((category, i) => (
          <details className="zn-chip" key={category.title} style={{ transform: `rotate(${i % 2 === 0 ? -0.7 : 0.5}deg)` }}>
            <summary>
              {category.title} <span className="zn-chip-count">{category.pages.length}</span>
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
        <a href="#resources" className="zn-chip-static" style={{ transform: 'rotate(0.8deg)' }}>
          Everything else you can photograph
        </a>
      </div>
    </div>
  );
}

export default ZineResources;
