import { useId, useMemo } from 'react';

// Sky dome: azimuth runs left to right (N at both edges, S in the centre, E on the left, W on the right,
// as if facing south). Elevation is exaggerated so Sun/Earth near the horizon stay readable.

const W = 400;
const H = 290;
const CX = 200;
const CY = 185;
const R = 165;
const RAD = Math.PI / 180;

const stretch = (el) => Math.sign(el) * 90 * Math.sqrt(Math.min(Math.abs(el), 90) / 90);

function project(az, el) {
  const ve = stretch(el) * RAD;
  const x = CX + ((az - 180) / 180) * R * 0.94 * Math.cos(ve);
  const y = CY - R * Math.sin(ve);
  return { x, y: Math.min(y, H - 16) };
}

function makeStars() {
  const stars = [];
  let seed = 42;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) {
    const x = CX - R + rnd() * R * 2;
    const y = CY - R + rnd() * R;
    if ((x - CX) ** 2 + (y - CY) ** 2 < (R - 6) ** 2) {
      stars.push({ x, y, r: 0.4 + rnd() * 0.9, d: rnd() * 4 });
    }
  }
  return stars;
}
const STARS = makeStars();

function clampLabelY(y) {
  return Math.max(14, y);
}

export default function SkyDome({ sun, earth, horizon }) {
  const uid = useId().replace(/:/g, '');
  const sunP = project(sun.az, sun.el);
  const earthP = project(earth.az, earth.el);

  const terrainPath = useMemo(() => {
    if (!horizon || !horizon.length) return '';
    const pts = horizon.map((p) => project(p.az, Math.max(p.el, 0)));
    return (
      `M ${pts[0].x.toFixed(1)} ${CY} ` +
      pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${CY} Z`
    );
  }, [horizon]);

  const compassMarks = [
    { az: 0, t: 'N' },
    { az: 90, t: 'E' },
    { az: 180, t: 'S' },
    { az: 270, t: 'W' },
    { az: 360, t: 'N' },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label={`Sky dome. Sun at ${sun.el.toFixed(1)} degrees elevation, ${sun.visible ? 'visible' : 'not visible'}. Earth at ${earth.el.toFixed(1)} degrees elevation, ${earth.visible ? 'visible' : 'not visible'}.`}
    >
      <defs>
        <clipPath id={`clip${uid}`}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="100%" stopColor="#0d1a45" />
        </linearGradient>
        <radialGradient id={`sunGlow${uid}`}>
          <stop offset="0%" stopColor="#fffbe0" stopOpacity="1" />
          <stop offset="25%" stopColor="#fde047" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#facc15" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`earthGlow${uid}`}>
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`earthBody${uid}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient id={`terrain${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b3f52" />
          <stop offset="100%" stopColor="#14161f" />
        </linearGradient>
        <linearGradient id={`ring${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* outer glow ring */}
      <circle cx={CX} cy={CY} r={R + 3} fill="none" stroke={`url(#ring${uid})`} strokeWidth="1.5" opacity="0.8" />

      <g clipPath={`url(#clip${uid})`}>
        {/* sky */}
        <rect x="0" y="0" width={W} height={CY} fill={`url(#sky${uid})`} />
        {STARS.map((s, i) => (
          <circle
            key={i}
            className="star-dot"
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}

        {/* below horizon */}
        <rect x="0" y={CY} width={W} height={H - CY} fill="#000" opacity="0.72" />
        <text x={CX} y={H - 6} textAnchor="middle" fontSize="9" letterSpacing="2" fill="#94a3b8" opacity="0.7">
          BELOW HORIZON
        </text>

        {/* Earth */}
        <g opacity={earth.visible ? 1 : 0.35}>
          {earth.visible && <circle cx={earthP.x} cy={earthP.y} r="24" fill={`url(#earthGlow${uid})`} />}
          <circle
            cx={earthP.x}
            cy={earthP.y}
            r="10.5"
            fill={`url(#earthBody${uid})`}
            stroke={earth.visible ? '#bfdbfe' : '#93c5fd'}
            strokeWidth="1"
            strokeDasharray={earth.visible ? undefined : '3 2'}
          />
          <ellipse cx={earthP.x - 3} cy={earthP.y - 3} rx="3.5" ry="2" fill="#fff" opacity="0.35" />
          <text
            x={earthP.x}
            y={clampLabelY(earthP.y - 18)}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            letterSpacing="1.5"
            fill="#93c5fd"
          >
            EARTH
          </text>
        </g>

        {/* Sun */}
        <g opacity={sun.visible ? 1 : 0.35}>
          {sun.visible && (
            <circle className="sun-glow" cx={sunP.x} cy={sunP.y} r="34" fill={`url(#sunGlow${uid})`} />
          )}
          <circle
            cx={sunP.x}
            cy={sunP.y}
            r="8"
            fill="#fde047"
            stroke={sun.visible ? '#fff' : '#facc15'}
            strokeWidth="1.2"
            strokeDasharray={sun.visible ? undefined : '3 2'}
          />
          <text
            x={sunP.x}
            y={clampLabelY(sunP.y - 16)}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            letterSpacing="1.5"
            fill="#fde047"
          >
            SUN
          </text>
        </g>

        {/* terrain silhouette (drawn on top so ridges can hide the Sun/Earth) */}
        <path d={terrainPath} fill={`url(#terrain${uid})`} opacity="0.93" stroke="#cbd5e1" strokeOpacity="0.35" strokeWidth="1" />

        {/* horizon line */}
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      </g>

      {/* compass */}
      {compassMarks.map((m, i) => {
        const x = CX + ((m.az - 180) / 180) * R * 0.94;
        return (
          <g key={i}>
            <line x1={x} y1={CY} x2={x} y2={CY + 5} stroke="#fff" strokeOpacity="0.5" />
            <text x={x} y={CY + 17} textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="600">
              {m.t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
