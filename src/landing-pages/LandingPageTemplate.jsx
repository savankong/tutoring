import LpHead from './components/LpHead.jsx';
import LpHeader from './components/LpHeader.jsx';
import LpFooter from './components/LpFooter.jsx';
import LpHero from './components/LpHero.jsx';
import LpHowItWorks from './components/LpHowItWorks.jsx';
import LpWhyItWorks from './components/LpWhyItWorks.jsx';
import LpSampleQA from './components/LpSampleQA.jsx';
import LpFaq from './components/LpFaq.jsx';
import LpOfficialSource from './components/LpOfficialSource.jsx';
import LpRelatedLinks from './components/LpRelatedLinks.jsx';
import LpCtaFooter from './components/LpCtaFooter.jsx';
import LpResourcesFooter from './components/LpResourcesFooter.jsx';

function LandingPageTemplate({ content, allContent }) {
  return (
    <div className="landing lp-page">
      <LpHead content={content} />
      <LpHeader />
      <LpHero content={content} />
      <LpHowItWorks />
      <LpWhyItWorks content={content} />
      <LpSampleQA content={content} />
      <LpFaq content={content} />
      <LpOfficialSource content={content} />
      <LpRelatedLinks content={content} allContent={allContent} />
      <LpCtaFooter content={content} />
      <LpResourcesFooter />
      <LpFooter />
    </div>
  );
}

export default LandingPageTemplate;
