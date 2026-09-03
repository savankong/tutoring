// This box sits at the exact moment a visitor decides "this isn't the real
// training, I need to go elsewhere" — analytics confirmed outbound clicks
// straight from here to jko.jten.mil/cdse.edu/cyber.mil on the AT-Level-1,
// OPSEC, and Cyber Awareness pages specifically. The outbound link itself
// stays (removing it would just be dishonest — Cambo isn't the official
// course), but the intercept CTA below it is the actual fix: someone about
// to open the official portal is told, right here, that Cambo can be used
// alongside it — captioned "while you're in it," not instead of it — so the
// click doesn't have to be a dead end for us.
function LpOfficialSource({ content }) {
  if (!content.officialSource) return null;
  const { label, url } = content.officialSource;

  return (
    <div className="zn-lp-official">
      <p>
        Looking for the official training, not practice questions?{' '}
        <a href={url} target="_blank" rel="noopener noreferrer">
          {label} ↗
        </a>
      </p>
      <div className="zn-lp-official-intercept">
        <p>Taking it right now? Snap a photo of any question you get stuck on — get the answer in seconds.</p>
        <a
          href={`/register?ref=${content.slug}`}
          className="zn-btn zn-btn-sm"
          event-name="CTA Click"
          event-slug={content.slug}
          event-location="official-source"
        >
          Try it free
        </a>
      </div>
    </div>
  );
}

export default LpOfficialSource;
