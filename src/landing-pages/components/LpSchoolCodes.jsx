// content.schoolCodes is computed at build time (build-landing-pages.mjs)
// by joining course-catalog.json against this page's courseKey — only Big
// 12 course pages have a courseKey, so this renders nothing on every other
// landing page (same optional-section pattern as LpOfficialSource).
function LpSchoolCodes({ content }) {
  if (!content.schoolCodes || content.schoolCodes.length === 0) return null;

  return (
    <section className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}>
          Also known as.
        </h2>
        <p>Same course, different course code depending on your school.</p>
      </div>
      <div className="zn-lp-related">
        {content.schoolCodes.map((sc) => (
          <a href={`/${sc.hubSlug}/`} key={`${sc.hubSlug}-${sc.code}`}>
            {sc.code} ({sc.schoolName}
            {sc.track ? `, ${sc.track}` : ''})
          </a>
        ))}
      </div>
    </section>
  );
}

export default LpSchoolCodes;
