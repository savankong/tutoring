import { useId } from 'react';

// Viewfinder-bracket mark: frames a focus point, with the red dot doubling
// as the record indicator — same motif as the capture screen's corner
// brackets and shutter button. Brackets use currentColor so they follow
// the surrounding text color (and adapt automatically in dark mode).
function Logo({ size = 22, wordmark = false, className = '' }) {
  const gradientId = useId();

  return (
    <span className={`logo-lockup ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <radialGradient id={gradientId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ff6b5e" />
            <stop offset="100%" stopColor="#d81f0f" />
          </radialGradient>
        </defs>
        <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M3 22V11a8 8 0 0 1 8-8h11" />
          <path d="M42 3h11a8 8 0 0 1 8 8v11" />
          <path d="M61 42v11a8 8 0 0 1-8 8H42" />
          <path d="M22 61H11a8 8 0 0 1-8-8V42" />
        </g>
        <circle cx="32" cy="32" r="9" fill={`url(#${gradientId})`} />
      </svg>
      {wordmark && <span className="logo-wordmark">Cambo</span>}
    </span>
  );
}

export default Logo;
