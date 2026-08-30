// Google Fonts for the zine redesign (Bricolage Grotesque + Archivo), loaded
// per-page via <Seo>'s children (react-helmet-async) rather than globally in
// index.html — only pages using the zine design system pull these in.
//
// MUST be a plain array of elements, not a Fragment (`<>...</>`) and not a
// component rendered as `<ZineFonts />` — both of those are broken, in two
// different ways:
//
// 1. A component (`<ZineFonts />`): react-helmet-async inspects a Helmet
//    child's `.type` directly without ever rendering it. A custom
//    component's `.type` is a function reference, which fails Helmet's
//    "is this a real tag" check and throws a misleadingly-worded "nested
//    Helmet" invariant.
//
// 2. A Fragment (`<>{links}</>`): doesn't crash, but SILENTLY DROPS the
//    links in server-rendered output whenever the same <Helmet> also has a
//    direct (non-fragment) child of the same tag type — which it always
//    does here, since every <Seo> renders a direct `<link rel="canonical">`
//    alongside `{ZineFonts}`. react-helmet-async's internal
//    mapChildrenToProps special-cases a Fragment child by recursing into it
//    with a fresh local accumulator, then returns to the outer loop; when
//    the outer loop finishes, its own final merge for that tag type
//    (`mapArrayTypeChildrenToProps`) OVERWRITES rather than concatenates,
//    so the outer level's own direct children (here: canonical) clobber
//    whatever the nested Fragment contributed. Confirmed with a minimal
//    renderToStaticMarkup repro — swapping the Fragment for a plain array
//    fixes it, because React.Children.forEach flattens a plain array child
//    into the SAME top-level iteration as the direct siblings, so they all
//    accumulate together instead of being merged via two separate calls.
//    This only shows up in SSR/static output (prerender.mjs,
//    build-landing-pages.mjs) — react-helmet-async's client-side path
//    mutates document.head directly and doesn't hit this code, which is
//    why it can look fine in a dev-server / hydrated check and still ship
//    broken to production. If you ever add another Seo-children constant
//    like this one, keep it a plain array for the same reason.
const ZINE_FONTS = [
  <link key="zn-font-preconnect-googleapis" rel="preconnect" href="https://fonts.googleapis.com" />,
  <link key="zn-font-preconnect-gstatic" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />,
  <link
    key="zn-font-stylesheet"
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Archivo:wght@400;500;600;700&display=swap"
  />,
];

export default ZINE_FONTS;
