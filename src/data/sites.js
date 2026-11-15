// Curated landing sites with real selenographic coordinates (degrees, east longitude positive).
// `horizon` is a simplified terrain-mask profile: horizon elevation (deg) = base + amp * sin(k * azimuth + phase).
// It is a stand-in for a real LOLA DEM horizon calculation.

export const SITES = [
  {
    id: 'shackleton',
    name: 'Shackleton Crater Rim',
    lat: -89.9,
    lon: 0,
    type: 'Polar crater rim',
    blurb: 'Sits beside permanently shadowed ice. The rim sees the Sun almost all year.',
    horizon: { base: 0.55, amp: 0.9, k: 3, phase: 0.4 },
  },
  {
    id: 'malapert',
    name: 'Malapert Massif',
    lat: -86.0,
    lon: 0,
    type: 'Polar massif',
    blurb: 'A tall peak with an almost constant line of sight to Earth.',
    horizon: { base: 0.1, amp: 0.3, k: 2, phase: 1.2 },
  },
  {
    id: 'nobile',
    name: 'Nobile Crater',
    lat: -85.3,
    lon: 30,
    type: 'Polar crater',
    blurb: 'Candidate Artemis region with good light and a short Earth link.',
    horizon: { base: 0.3, amp: 0.6, k: 4, phase: 2.1 },
  },
  {
    id: 'apollo11',
    name: 'Apollo 11 - Sea of Tranquility',
    lat: 0.67,
    lon: 23.47,
    type: 'Equatorial mare',
    blurb: 'Flat equatorial plain. High Sun, Earth almost overhead, 14-day nights.',
    horizon: { base: 0, amp: 0, k: 1, phase: 0 },
  },
  {
    id: 'degerlache',
    name: 'de Gerlache Crater',
    lat: -88.5,
    lon: 88,
    type: 'Polar crater',
    blurb: 'Deep polar crater with rugged walls and heavy shadowing.',
    horizon: { base: 0.6, amp: 1.0, k: 3, phase: 3.0 },
  },
];

export const CUSTOM_ID = 'custom';
export const DEFAULT_HORIZON = { base: 0.3, amp: 0.5, k: 3, phase: 1.0 };
export const DEFAULT_SLOTS = ['shackleton', 'malapert', 'nobile'];
export const SLOT_COLORS = ['#a78bfa', '#2dd4bf', '#fb923c'];
export const SLOT_LETTERS = ['A', 'B', 'C'];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Turns a dropdown slot ({ id, lat, lon }) into a full site object.
export function resolveSite(slot, index) {
  if (slot.id !== CUSTOM_ID) {
    return SITES.find((s) => s.id === slot.id) || SITES[0];
  }
  const lat = clamp(parseFloat(slot.lat) || 0, -90, 90);
  const lon = clamp(parseFloat(slot.lon) || 0, -180, 180);
  return {
    id: `custom-${index}`,
    name: `Custom Site ${SLOT_LETTERS[index]}`,
    lat,
    lon,
    type: 'Custom coordinates',
    blurb: 'Your own coordinates, using a generic terrain profile.',
    horizon: DEFAULT_HORIZON,
  };
}
