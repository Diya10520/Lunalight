// MVP uses validated simplified ephemeris. Production version plugs in JPL Horizons API + LOLA DEM for horizon masking.

export const SYNODIC_DAYS = 29.53; // lunar day (new moon to new moon), Earth days
export const MS_DAY = 86400000;
const MS_HOUR = 3600000;

// Approximate new moon used as phase reference (2026-11-09 13:02 UTC).
const REF_NEW_MOON = Date.UTC(2026, 10, 9, 13, 2);
const AXIAL_TILT = 1.54; // Moon's spin axis tilt to the ecliptic -> max sub-solar latitude (deg)
const LIBRATION_AMP = 2; // Earth wobble in the lunar sky (deg), simplified +/- 2
const POLAR_REF_ELEVATION = 4; // best-case grazing sun angle usable by polar mast arrays (deg)
const FALLBACK_HORIZON = { base: 0.3, amp: 0.5, k: 3, phase: 1 };

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const wrap360 = (a) => ((a % 360) + 360) % 360;
const wrap180 = (a) => ((a + 540) % 360) - 180;

// ---------------------------------------------------------------- phase

const PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

export function lunarPhase(epochMs) {
  const days = (epochMs - REF_NEW_MOON) / MS_DAY;
  const fraction = (((days / SYNODIC_DAYS) % 1) + 1) % 1;
  const idx = Math.floor(fraction * 8 + 0.5) % 8;
  return { age: fraction * SYNODIC_DAYS, fraction, name: PHASE_NAMES[idx], idx };
}

// ---------------------------------------------------------------- body positions (selenographic)

// Point on the Moon where the Sun is directly overhead.
export function subSolarPoint(epochMs) {
  const { fraction } = lunarPhase(epochMs);
  const lon = wrap180(180 - 360 * fraction); // new moon -> 180, first quarter -> +90, full -> 0
  const year = new Date(epochMs).getUTCFullYear();
  const doy = (epochMs - Date.UTC(year, 0, 1)) / MS_DAY;
  const lat = AXIAL_TILT * Math.sin((2 * Math.PI * (doy - 80)) / 365.25);
  return { lat, lon };
}

// Point on the Moon where Earth is directly overhead (tidal lock + small libration wobble).
export function subEarthPoint(epochMs) {
  const d = (epochMs - REF_NEW_MOON) / MS_DAY;
  const lat = LIBRATION_AMP * Math.sin((2 * Math.PI * d) / 27.21);
  const lon = LIBRATION_AMP * Math.sin((2 * Math.PI * d) / 27.55 + 0.8);
  return { lat, lon };
}

// Azimuth (0 = N, 90 = E) and elevation of a body as seen from a surface site.
function lookAngles(lat, lon, bodyLat, bodyLon) {
  const phi = lat * RAD;
  const lam = lon * RAD;
  const bphi = bodyLat * RAD;
  const blam = bodyLon * RAD;

  const bx = Math.cos(bphi) * Math.cos(blam);
  const by = Math.cos(bphi) * Math.sin(blam);
  const bz = Math.sin(bphi);

  const ux = Math.cos(phi) * Math.cos(lam);
  const uy = Math.cos(phi) * Math.sin(lam);
  const uz = Math.sin(phi);

  const ex = -Math.sin(lam);
  const ey = Math.cos(lam);

  const nx = -Math.sin(phi) * Math.cos(lam);
  const ny = -Math.sin(phi) * Math.sin(lam);
  const nz = Math.cos(phi);

  const up = bx * ux + by * uy + bz * uz;
  const east = bx * ex + by * ey;
  const north = bx * nx + by * ny + bz * nz;

  return {
    el: Math.asin(clamp(up, -1, 1)) * DEG,
    az: wrap360(Math.atan2(east, north) * DEG),
  };
}

// ---------------------------------------------------------------- terrain mask

// Horizon elevation (deg) at a given azimuth. Stand-in for a LOLA DEM horizon profile.
export function horizonMask(site, az) {
  const h = site.horizon || FALLBACK_HORIZON;
  // Terrain never dips below the true horizon, so a body at negative elevation is never "visible".
  return Math.max(0, h.base + h.amp * Math.sin(h.k * az * RAD + h.phase));
}

export function horizonProfile(site, stepDeg = 3) {
  const pts = [];
  for (let az = 0; az <= 360; az += stepDeg) {
    pts.push({ az, el: horizonMask(site, az) });
  }
  return pts;
}

// ---------------------------------------------------------------- state at one instant

function describeBody(site, look) {
  const mask = horizonMask(site, look.az);
  const margin = look.el - mask;
  return {
    az: look.az,
    el: look.el,
    mask,
    margin,
    visible: margin > 0,
    blocked: look.el > 0 && margin <= 0, // above the true horizon but behind terrain
  };
}

export function computeState(site, epochMs) {
  const sunPt = subSolarPoint(epochMs);
  const earthPt = subEarthPoint(epochMs);

  const sun = describeBody(site, lookAngles(site.lat, site.lon, sunPt.lat, sunPt.lon));
  const earth = describeBody(site, lookAngles(site.lat, site.lon, earthPt.lat, earthPt.lon));

  // Power % from sin(solar elevation). Flat sites are normalised to a 90 deg Sun;
  // polar sites to the best-case grazing angle that tilted/vertical arrays can still use.
  const refEl = site.lat <= -80 ? POLAR_REF_ELEVATION : 90;
  const power = sun.visible
    ? clamp(Math.sin(sun.el * RAD) / Math.sin(refEl * RAD), 0, 1) * 100
    : 0;

  let verdict;
  let reason;
  if (!sun.visible) {
    verdict = 'NO-GO';
    reason = sun.blocked
      ? 'Sun is hidden behind terrain. No solar power.'
      : 'Sun is below the horizon. No solar power.';
  } else if (earth.visible) {
    verdict = 'GO';
    reason = 'Sun and Earth are both in view. Power and a direct-to-Earth link.';
  } else {
    verdict = 'CAUTION';
    reason = earth.blocked
      ? 'Sunlit, but terrain blocks Earth. Power OK, no direct link.'
      : 'Sunlit, but Earth is below the horizon. Power OK, no direct link.';
  }

  return { sun, earth, power, verdict, reason };
}

// ---------------------------------------------------------------- forward-looking analysis

// Scans one lunar day forward (hourly) from `epochMs`.
export function analyzeSite(site, epochMs) {
  const steps = Math.round(SYNODIC_DAYS * 24);
  const first = computeState(site, epochMs);
  let sunHours = 0;
  let earthHours = 0;
  let sunChange = null;
  let earthChange = null;

  for (let i = 0; i < steps; i++) {
    const s = computeState(site, epochMs + i * MS_HOUR);
    if (s.sun.visible) sunHours++;
    if (s.earth.visible) earthHours++;
    if (sunChange === null && s.sun.visible !== first.sun.visible) sunChange = i / 24;
    if (earthChange === null && s.earth.visible !== first.earth.visible) earthChange = i / 24;
  }

  return {
    sunlitDays: sunHours / 24,
    sunlitPct: (sunHours / steps) * 100,
    earthPct: (earthHours / steps) * 100,
    sunEvent: { type: first.sun.visible ? 'sunset' : 'sunrise', days: sunChange },
    earthEvent: { type: first.earth.visible ? 'earthset' : 'earthrise', days: earthChange },
  };
}

// Sun height above the local horizon across one lunar day, plus sunrise/sunset markers.
export function buildTimeline(site, baseEpochMs, stepDays = 1 / 8) {
  const n = Math.round(SYNODIC_DAYS / stepDays);
  const points = [];
  const events = [];
  let prev = null;

  for (let i = 0; i <= n; i++) {
    const day = i * stepDays;
    const s = computeState(site, baseEpochMs + day * MS_DAY);
    points.push({
      day: Math.round(day * 1000) / 1000,
      margin: Math.round(s.sun.margin * 1000) / 1000,
      power: Math.round(s.power * 10) / 10,
    });
    if (prev && prev.sun.visible !== s.sun.visible) {
      const a = prev.sun.margin;
      const b = s.sun.margin;
      const t = a === b ? 0 : clamp(a / (a - b), 0, 1);
      events.push({
        day: Math.round((i - 1 + t) * stepDays * 1000) / 1000,
        type: s.sun.visible ? 'sunrise' : 'sunset',
      });
    }
    prev = s;
  }
  return { points, events };
}

// ---------------------------------------------------------------- formatting helpers

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
export function compass(az) {
  return COMPASS[Math.round(wrap360(az) / 22.5) % 16];
}

export function formatDuration(days) {
  const totalHours = Math.round(days * 24);
  if (totalHours < 1) return '<1h';
  const d = Math.floor(totalHours / 24);
  const h = totalHours % 24;
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

export function formatUtc(epochMs) {
  return `${new Date(epochMs).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function formatShortDate(epochMs) {
  return new Date(epochMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
