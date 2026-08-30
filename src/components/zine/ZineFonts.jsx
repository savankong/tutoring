// Google Fonts for the zine redesign (Bricolage Grotesque + Archivo), loaded
// per-page via <Seo>'s children (react-helmet-async) rather than globally in
// index.html — only pages using the zine design system pull these in.
//
// A plain element constant, NOT a component (don't change this to `function
// ZineFonts() {...}` and render it as `<ZineFonts />`) — react-helmet-async
// only recognizes literal DOM tags / Fragments as Helmet children by
// inspecting child.type directly; it never actually renders its children,
// so a custom component's `.type` is a function reference, which fails its
// "is this a real tag" check and throws a (misleadingly worded) "nested
// Helmet" invariant. A Fragment element's `.type` is the Fragment symbol,
// which Helmet knows to recurse into — so this must stay a Fragment, used
// as `<Seo>{ZINE_FONTS}</Seo>`, not `<Seo><ZineFonts /></Seo>`.
const ZINE_FONTS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Archivo:wght@400;500;600;700&display=swap"
    />
  </>
);

export default ZINE_FONTS;
