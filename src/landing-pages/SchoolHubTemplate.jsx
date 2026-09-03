import HubHead from './components/HubHead.jsx';
import HubHeader from './components/HubHeader.jsx';
import HubCourseList from './components/HubCourseList.jsx';
import LpFooter from './components/LpFooter.jsx';
import LpHero from './components/LpHero.jsx';
import LpHowItWorks from './components/LpHowItWorks.jsx';
import LpFaq from './components/LpFaq.jsx';
import LpRelatedLinks from './components/LpRelatedLinks.jsx';
import LpCtaFooter from './components/LpCtaFooter.jsx';
import LpResourcesFooter from './components/LpResourcesFooter.jsx';
import '../styles/zine.css';
import '../styles/zine-lp.css';

// School hub pages are a course-code directory, not a quiz — deliberately a
// different component tree from LandingPageTemplate.jsx, sharing only the
// pieces that are genuinely generic (header/footer/CTA/how-it-works/FAQ).
function SchoolHubTemplate({ content, allContent }) {
  return (
    <div className="zn-root">
      <HubHead content={content} />
      <div className="zn-grain" />
      <HubHeader />
      <LpHero content={content} />
      <LpHowItWorks />
      <HubCourseList content={content} />
      {content.faqs && <LpFaq content={content} />}
      <LpRelatedLinks content={content} allContent={allContent} />
      <LpCtaFooter content={content} />
      <LpResourcesFooter />
      <LpFooter />
    </div>
  );
}

export default SchoolHubTemplate;
