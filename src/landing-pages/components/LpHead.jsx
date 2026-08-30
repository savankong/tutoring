import { faqSchema } from './LpFaq.jsx';
import { quizSchema } from './LpSampleQA.jsx';

const SITE_URL = 'https://camboapp.com';

// Same shape as the homepage's SoftwareApplication schema (src/pages/Landing.jsx)
// — campaign pages didn't have this at all before, only FAQPage.
function softwareAppSchema(content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Cambo App',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web-based)',
    url: `${SITE_URL}/${content.slug}/`,
    description: content.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

// Landing pages never hydrate, so there's no react-helmet-async here — just
// plain <title>/<meta>/<link> elements. React 19 auto-hoists these to the
// document head during render (client or server), the same mechanism the
// prerendered marketing pages rely on.
function LpHead({ content }) {
  const url = `${SITE_URL}/${content.slug}/`;
  const ogImage = `${SITE_URL}/og/${content.slug}.png`;

  return (
    <>
      <title>{content.metaTitle}</title>
      <meta name="description" content={content.metaDescription} />
      <link rel="canonical" href={url} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Archivo:wght@400;500;600;700&display=swap"
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={content.metaTitle} />
      <meta property="og:description" content={content.metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={content.metaTitle} />
      <meta name="twitter:description" content={content.metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json">{JSON.stringify(faqSchema(content))}</script>
      <script type="application/ld+json">{JSON.stringify(quizSchema(content))}</script>
      <script type="application/ld+json">{JSON.stringify(softwareAppSchema(content))}</script>
      {/* Plausible site script — the event-name/event-* attributes on the CTA
          anchors in LpHero/LpCtaFooter fire as custom events on click if the
          "Custom Events" (tagged elements) extension is enabled for this
          script in the Plausible site settings; harmless no-ops otherwise. */}
      <script async src="https://plausible.io/js/pa-q_udJRciP4RoryL1Fe69D.js"></script>
      <script>{`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}</script>
    </>
  );
}

export default LpHead;
