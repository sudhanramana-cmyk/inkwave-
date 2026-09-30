export function generateCoverSvg(theme: string, title?: string): string {
  const palettes: Record<string, { bg1: string; bg2: string; accent1: string; accent2: string; ink: string; grid: string }> = {
    silence: {
      bg1: '#0B132B',
      bg2: '#1C2541',
      accent1: '#2563EB',
      accent2: '#EA580C',
      ink: '#F8FAFC',
      grid: 'rgba(248,250,252,0.07)'
    },
    architecture: {
      bg1: '#18181B',
      bg2: '#27272A',
      accent1: '#EA580C',
      accent2: '#D97706',
      ink: '#FAFAF9',
      grid: 'rgba(250,250,249,0.08)'
    },
    systems: {
      bg1: '#090D16',
      bg2: '#1E293B',
      accent1: '#3B82F6',
      accent2: '#10B981',
      ink: '#F1F5F9',
      grid: 'rgba(59,130,246,0.1)'
    },
    science: {
      bg1: '#061A23',
      bg2: '#0F3142',
      accent1: '#06B6D4',
      accent2: '#3B82F6',
      ink: '#ECFEFF',
      grid: 'rgba(6,182,212,0.09)'
    },
    compiler: {
      bg1: '#111827',
      bg2: '#1F2937',
      accent1: '#F97316',
      accent2: '#2563EB',
      ink: '#F9FAFB',
      grid: 'rgba(249,115,22,0.08)'
    },
    economics: {
      bg1: '#1C1917',
      bg2: '#292524',
      accent1: '#15803D',
      accent2: '#EA580C',
      ink: '#F5F5F4',
      grid: 'rgba(245,245,244,0.07)'
    },
    midnight: {
      bg1: '#070B19',
      bg2: '#151E3F',
      accent1: '#38BDF8',
      accent2: '#FB923C',
      ink: '#F8FAFC',
      grid: 'rgba(56,189,248,0.08)'
    },
    typography: {
      bg1: '#231F20',
      bg2: '#373234',
      accent1: '#EA580C',
      accent2: '#3B82F6',
      ink: '#FBF9F5',
      grid: 'rgba(251,249,245,0.08)'
    }
  };

  const p = palettes[theme] || palettes.silence;
  const seed = (theme || 'silence').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const offset = (seed % 5) * 35;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="100%" stop-color="${p.bg2}" />
      </linearGradient>
      <radialGradient id="glow1" cx="75%" cy="28%" r="55%">
        <stop offset="0%" stop-color="${p.accent1}" stop-opacity="0.42" />
        <stop offset="100%" stop-color="${p.accent1}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="glow2" cx="25%" cy="78%" r="50%">
        <stop offset="0%" stop-color="${p.accent2}" stop-opacity="0.34" />
        <stop offset="100%" stop-color="${p.accent2}" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="${p.grid}" stroke-width="1" />
      </pattern>
    </defs>

    <rect width="1200" height="675" fill="url(#bg)" />
    <rect width="1200" height="675" fill="url(#glow1)" />
    <rect width="1200" height="675" fill="url(#glow2)" />
    <rect width="1200" height="675" fill="url(#grid)" />

    <!-- Architectural / Editorial Wave Lines -->
    <g fill="none" stroke="${p.ink}" stroke-opacity="0.16" stroke-width="1.5">
      <path d="M -100 ${420 - offset} C 280 ${220 + offset}, 680 ${560 - offset}, 1300 ${280 + offset}" />
      <path d="M -100 ${460 - offset} C 310 ${260 + offset}, 710 ${600 - offset}, 1300 ${320 + offset}" stroke-opacity="0.24" stroke="${p.accent1}" stroke-width="2" />
      <path d="M -100 ${500 - offset} C 340 ${300 + offset}, 740 ${640 - offset}, 1300 ${360 + offset}" />
      <path d="M -100 ${540 - offset} C 370 ${340 + offset}, 770 ${680 - offset}, 1300 ${400 + offset}" stroke="${p.accent2}" stroke-opacity="0.28" />
    </g>

    <!-- Geometric Editorial Focal Composition -->
    <g transform="translate(${580 + offset}, ${160})">
      <circle cx="240" cy="180" r="165" fill="none" stroke="${p.ink}" stroke-opacity="0.18" stroke-width="1.2" />
      <circle cx="240" cy="180" r="115" fill="none" stroke="${p.accent1}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="6 6" />
      <rect x="60" y="55" width="220" height="260" rx="8" fill="${p.bg1}" fill-opacity="0.65" stroke="${p.ink}" stroke-opacity="0.22" stroke-width="1.2" />
      <line x1="92" y1="105" x2="210" y2="105" stroke="${p.accent2}" stroke-width="3" stroke-linecap="round" />
      <line x1="92" y1="138" x2="245" y2="138" stroke="${p.ink}" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round" />
      <line x1="92" y1="166" x2="225" y2="166" stroke="${p.ink}" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round" />
      <line x1="92" y1="194" x2="190" y2="194" stroke="${p.ink}" stroke-opacity="0.28" stroke-width="2" stroke-linecap="round" />
      <circle cx="305" cy="120" r="42" fill="${p.accent2}" fill-opacity="0.82" />
      <circle cx="115" cy="265" r="18" fill="${p.accent1}" fill-opacity="0.9" />
    </g>

    <!-- Subtle Editorial Corner Marks -->
    <g stroke="${p.ink}" stroke-opacity="0.25" stroke-width="1.5" fill="none">
      <path d="M 48 72 L 48 48 L 72 48" />
      <path d="M 1152 72 L 1152 48 L 1128 48" />
      <path d="M 48 603 L 48 627 L 72 627" />
      <path d="M 1152 603 L 1152 627 L 1128 627" />
    </g>
  </svg>`;
}

export function generateAvatarSvg(seedName: string): string {
  const colors = [
    ['#0B132B', '#2563EB', '#EA580C'],
    ['#1E293B', '#EA580C', '#38BDF8'],
    ['#0F172A', '#10B981', '#3B82F6'],
    ['#18181B', '#F97316', '#60A5FA'],
    ['#172554', '#38BDF8', '#FB923C']
  ];
  const hash = (seedName || 'inkwave').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [bg, c1, c2] = colors[hash % colors.length];
  const initials = (seedName || 'IW')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('') || 'IW';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="avbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg}" />
        <stop offset="100%" stop-color="${c1}" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="80" fill="url(#avbg)" />
    <circle cx="122" cy="38" r="34" fill="${c2}" fill-opacity="0.35" />
    <path d="M 18 118 Q 80 88 142 118" fill="none" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="2" />
    <text x="80" y="92" text-anchor="middle" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-weight="600" font-size="48" letter-spacing="1">${initials}</text>
  </svg>`;
}
