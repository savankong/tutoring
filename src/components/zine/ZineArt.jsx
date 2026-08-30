// Small hand-drawn SVG accents shared across the zine-redesign homepage and
// pricing page — ported path-for-path from the Claude Design export so the
// wobble/circle motifs stay consistent everywhere they're reused.

export function ZineUnderline({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 300 34" preserveAspectRatio="none">
      <path
        d="M4 22 C 70 9, 150 27, 214 13 C 250 6, 278 16, 296 11"
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ZineCircleThin({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 300 62" preserveAspectRatio="none">
      <path
        d="M88 6 C 30 7, 5 19, 7 32 C 9 46, 54 57, 132 56 C 216 55, 290 46, 293 31 C 296 16, 240 5, 156 5 C 116 5, 70 9, 46 17"
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ZineCircleSmall({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 320 40" preserveAspectRatio="none">
      <path
        d="M96 4 C 34 5, 5 13, 6 21 C 8 30, 58 37, 148 36 C 236 35, 314 30, 315 20 C 316 11, 258 4, 168 4 C 132 4, 90 6, 62 11"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ZineCircleWord({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 260 60" preserveAspectRatio="none">
      <path
        d="M74 5 C 26 5, 4 17, 6 30 C 8 44, 46 55, 116 55 C 190 55, 250 45, 253 30 C 256 15, 208 4, 132 4 C 96 4, 58 8, 40 15"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TORN_PATHS = [
  'M8 11 C 110 4, 300 14, 392 6 C 397 84, 393 166, 390 233 C 280 240, 118 230, 10 236 C 5 158, 12 82, 8 11 Z',
  'M9 8 C 120 15, 290 3, 391 10 C 395 88, 392 168, 388 234 C 276 228, 122 238, 11 231 C 6 156, 13 80, 9 8 Z',
  'M7 12 C 108 6, 296 16, 393 8 C 396 90, 391 170, 389 232 C 282 238, 116 228, 9 235 C 4 160, 11 84, 7 12 Z',
];

export function ZineTornBorder({ variant = 0, color = '#141310' }) {
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="none">
      <path d={TORN_PATHS[variant % TORN_PATHS.length]} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function ZineArrow({ color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 40 18" className="zn-btn-arrow">
      <path d="M1 9 C 12 4, 24 13, 37 9" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 3 L 38 9 L 30 15" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
