import { CAMPAIGN_CATEGORIES } from '../../lib/campaignPages.js';

// Plain <a> tags, not <Link> — landing pages render via renderToStaticMarkup
// with no React Router context, so react-router-dom's Link would throw.
function LpResourcesFooter() {
  return (
    <section id="resources" className="resources-section">
      <div className="section-eyebrow">Practice resources</div>
      <h2>Browse questions for a specific test or training.</h2>
      <p className="resources-intro">
        Cambo works on any question you can photograph — here are the ones tutors and students search for most.
      </p>
      <div className="resources-grid">
        {CAMPAIGN_CATEGORIES.map((category) => (
          <div className="resources-category" key={category.title}>
            <div className="resources-category-title">{category.title}</div>
            <ul className="resources-link-list">
              {category.pages.map((page) => (
                <li key={page.slug}>
                  <a href={`/${page.slug}/`}>{page.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LpResourcesFooter;
