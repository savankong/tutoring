import { faqSchema } from './LpFaq.jsx';

const SITE_URL = 'https://camboapp.com';

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
      {/* Plausible's tagged-events build: any element with event-name/event-*
          attributes fires a custom event on click, no custom JS needed —
          matches the CTA anchors in LpHero/LpCtaFooter. */}
      <script defer data-domain="camboapp.com" src="https://plausible.io/js/script.tagged-events.js"></script>
    </>
  );
}

export default LpHead;
