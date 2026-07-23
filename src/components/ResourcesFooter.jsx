import { Link } from 'react-router-dom';
import { CAMPAIGN_CATEGORIES } from '../lib/campaignPages.js';

function ResourcesFooter() {
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
                  <Link to={`/${page.slug}/`}>{page.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ResourcesFooter;
