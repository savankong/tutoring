function formatVerifiedDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// content.courses is computed at build time (build-school-hubs.mjs) by
// joining course-catalog.json's codes[] against this school's key — never
// authored by hand in the school's own content file, so it can't drift out
// of sync with the course pages it links to.
function HubCourseList({ content }) {
  if (!content.courses || content.courses.length === 0) return null;
  const verified = formatVerifiedDate(content.schoolVerifiedAt);

  return (
    <section id="courses" className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 46px)' }}>
          Your courses.
        </h2>
        {verified && <p>Course codes verified as of {verified}.</p>}
      </div>
      <div className="zn-lp-related">
        {content.courses.map((c) => (
          <a href={`/${c.courseSlug}/`} key={`${c.courseSlug}-${c.code}`}>
            {c.code} — {c.courseName}
            {c.track ? ` (${c.track})` : ''}
          </a>
        ))}
      </div>
    </section>
  );
}

export default HubCourseList;
