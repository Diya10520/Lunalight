import { useMemo } from 'react';
import SkyDome from './SkyDome.jsx';
import {
  analyzeSite,
  compass,
  computeState,
  formatDuration,
  horizonProfile,
} from '../utils/astro.js';
import { SLOT_COLORS, SLOT_LETTERS } from '../data/sites.js';

const VERDICT_STYLE = {
  GO: { color: '#22c55e', bg: 'rgba(34,197,94,0.14)' },
  CAUTION: { color: '#eab308', bg: 'rgba(234,179,8,0.14)' },
  'NO-GO': { color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
};

const TONE = {
  sun: '#fde047',
  earth: '#60a5fa',
  neutral: '#ffffff',
};

const signed = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}°`;

function Metric({ label, value, sub, tone = 'neutral', children }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 leading-tight">{label}</div>
      <div className="mt-1 text-xl font-bold leading-none" style={{ color: TONE[tone] }}>
        {value}
      </div>
      {children}
      {sub && <div className="mt-1 text-[11px] text-slate-400 leading-snug">{sub}</div>}
    </div>
  );
}

function sunsetMetric(state, a) {
  const d = a.sunEvent.days;
  if (state.sun.visible) {
    return d == null
      ? { value: 'No sunset', sub: 'Lit for the whole lunar day' }
      : { value: formatDuration(d), sub: 'until the Sun sets' };
  }
  return d == null
    ? { value: 'Dark', sub: 'No sunrise this lunar day' }
    : { value: 'Dark', sub: `Sunrise in ${formatDuration(d)}` };
}

function earthWindowSub(state, a) {
  const d = a.earthEvent.days;
  if (state.earth.visible) {
    return d == null ? 'Earth always in view' : `Earthset in ${formatDuration(d)}`;
  }
  return d == null ? 'Earth never in view' : `Earth rises in ${formatDuration(d)}`;
}

function plainEnglish(state) {
  const { sun, earth } = state;
  let sunText;
  if (!sun.visible) {
    sunText = sun.blocked
      ? 'A ridge is hiding the Sun, so this spot sits in shadow.'
      : 'The Sun is below the horizon. It is lunar night here.';
  } else if (sun.el < 3) {
    sunText = `The Sun is only ${sun.el.toFixed(1)}° up, like a never-ending sunset. Shadows stretch for kilometres.`;
  } else {
    sunText = `The Sun is ${sun.el.toFixed(0)}° up. Strong light and short shadows.`;
  }
  const earthText = earth.visible
    ? 'Earth is in view, so the lander can talk to it directly.'
    : 'Earth is out of sight, so the lander needs a relay to talk to home.';
  return `${sunText} ${earthText}`;
}

export default function CompareCard({ site, slotIndex, epoch, eduMode }) {
  const state = useMemo(() => computeState(site, epoch), [site, epoch]);
  const analysis = useMemo(() => analyzeSite(site, epoch), [site, epoch]);
  const horizon = useMemo(() => horizonProfile(site), [site]);

  const v = VERDICT_STYLE[state.verdict];
  const accent = SLOT_COLORS[slotIndex];
  const sunset = sunsetMetric(state, analysis);

  return (
    <article
      className="glass overflow-hidden flex flex-col transition-shadow duration-500"
      style={{
        borderColor: `${v.color}66`,
        boxShadow: `0 0 50px -18px ${v.color}`,
      }}
    >
      {/* header */}
      <header className="flex items-start gap-3 px-5 pt-5">
        <div
          className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-sm font-black text-black"
          style={{ background: accent }}
        >
          {SLOT_LETTERS[slotIndex]}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight truncate">{site.name}</h3>
          <p className="text-xs text-slate-400">
            {site.lat.toFixed(2)}°, {site.lon.toFixed(2)}° · {site.type}
          </p>
        </div>
      </header>
      <p className="px-5 mt-2 text-xs text-slate-400 leading-snug">{site.blurb}</p>

      {/* sky dome */}
      <div className="px-3 pt-2">
        <SkyDome sun={state.sun} earth={state.earth} horizon={horizon} />
      </div>
      <p className="px-5 -mt-1 text-[10px] text-slate-500 text-center">
        Elevation exaggerated for visibility · dark silhouette = local terrain
      </p>

      {/* verdict */}
      <div
        className="mx-5 mt-3 rounded-2xl px-4 py-3 flex items-center gap-4"
        style={{ background: v.bg, border: `1px solid ${v.color}66` }}
      >
        <div
          className="text-4xl font-black tracking-tight leading-none"
          style={{ color: v.color, textShadow: `0 0 24px ${v.color}` }}
        >
          {state.verdict}
        </div>
        <p className="text-xs text-slate-200 leading-snug">{state.reason}</p>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4">
        <Metric
          label="Solar Elevation"
          tone="sun"
          value={signed(state.sun.el)}
          sub={`Az ${state.sun.az.toFixed(0)}° ${compass(state.sun.az)}${state.sun.blocked ? ' · behind terrain' : ''}`}
        />
        <Metric
          label="Earth Elevation"
          tone="earth"
          value={signed(state.earth.el)}
          sub={`Earth visible: ${state.earth.visible ? 'Yes' : 'No'}${state.earth.blocked ? ' (terrain)' : ''}`}
        />
        <Metric
          label="Sunlight Duration"
          tone="sun"
          value={formatDuration(analysis.sunlitDays)}
          sub={`${Math.round(analysis.sunlitPct)}% of the next lunar day`}
        />
        <Metric
          label="Earth Visibility Window"
          tone="earth"
          value={`${Math.round(analysis.earthPct)}%`}
          sub={earthWindowSub(state, analysis)}
        />
        <Metric label="Power Generation" tone="sun" value={`${state.power.toFixed(0)}%`}>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${state.power}%`,
                background: 'linear-gradient(90deg,#f59e0b,#fde047)',
              }}
            />
          </div>
        </Metric>
        <Metric
          label="Time Before Sunset"
          tone={state.sun.visible ? 'sun' : 'neutral'}
          value={sunset.value}
          sub={sunset.sub}
        />
      </div>

      {eduMode && (
        <div className="mx-5 mt-3 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-100 leading-snug">
          <span className="font-bold">In plain English: </span>
          {plainEnglish(state)}
        </div>
      )}

      <div className="h-5" />
    </article>
  );
}
