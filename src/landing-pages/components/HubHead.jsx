import { faqSchema } from './LpFaq.jsx';

const SITE_URL = 'https://camboapp.com';

// Same SoftwareApplication schema every landing page carries (src/pages/Landing.jsx).
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

// Hub pages aren't a Quiz/FAQPage the way course pages are — the useful
// structured data here is the course list itself, so AI answer engines and
// Google can surface "which course code is X at this school" directly.
function itemListSchema(content) {
  if (!content.courses || content.courses.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: content.courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${c.code} — ${c.courseName}`,
      url: `${SITE_URL}/${c.courseSlug}/`,
    })),
  };
}

function HubHead({ content }) {
  const url = `${SITE_URL}/${content.slug}/`;
  const ogImage = `${SITE_URL}/og/${content.slug}.png`;
  const itemList = itemListSchema(content);

  return (
    <>
      <title>{content.metaTitle}</title>
      <meta name="description" content={content.metaDescription} />
      <link rel="canonical" href={url} />
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
      {content.faqs && <script type="application/ld+json">{JSON.stringify(faqSchema(content))}</script>}
      {itemList && <script type="application/ld+json">{JSON.stringify(itemList)}</script>}
      <script type="application/ld+json">{JSON.stringify(softwareAppSchema(content))}</script>
      <script async src="https://plausible.io/js/pa-q_udJRciP4RoryL1Fe69D.js"></script>
      <script>{`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}</script>
    </>
  );
}

export default HubHead;
