function LpOfficialSource({ content }) {
  if (!content.officialSource) return null;
  const { label, url } = content.officialSource;

  return (
    <p className="lp-official-source">
      Looking for the official training, not practice questions?{' '}
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label} ↗
      </a>
    </p>
  );
}

export default LpOfficialSource;
