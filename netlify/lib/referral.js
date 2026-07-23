// Landing page slugs are lowercase-kebab-case (see content/landing-pages/),
// so anything else arriving in a ref param/cookie is either stale, spoofed,
// or junk — drop it rather than storing it.
const REF_RE = /^[a-z0-9-]{1,64}$/;

export function sanitizeRef(value) {
  if (typeof value !== 'string') return null;
  return REF_RE.test(value) ? value : null;
}
