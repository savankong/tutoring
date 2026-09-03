import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Shared join helpers over content/course-catalog.json — the single source
// of truth for course-code mappings, read by both build-landing-pages.mjs
// (to enrich a Big 12 course page's "also known as" section) and
// build-school-hubs.mjs (to compute a school's course list). Neither script
// should encode codes redundantly in its own content files.

export function loadCourseCatalog(rootDir) {
  return JSON.parse(readFileSync(join(rootDir, 'content', 'course-catalog.json'), 'utf-8'));
}

export function schoolCodesForCourse(catalog, courseKey) {
  return catalog.codes
    .filter((c) => c.courseKey === courseKey)
    .map((c) => {
      const school = catalog.schools.find((s) => s.key === c.schoolKey);
      return {
        schoolName: school.name,
        code: c.code,
        track: c.track || null,
        hubSlug: school.hubSlug,
      };
    })
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName));
}

export function coursesForSchool(catalog, schoolKey) {
  return catalog.codes
    .filter((c) => c.schoolKey === schoolKey)
    .map((c) => {
      const course = catalog.courses.find((co) => co.key === c.courseKey);
      return {
        courseName: course.canonicalName,
        code: c.code,
        track: c.track || null,
        courseSlug: course.slug,
      };
    })
    .sort((a, b) => a.courseName.localeCompare(b.courseName));
}
