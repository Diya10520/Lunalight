import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildTimeline, formatShortDate, formatUtc, MS_DAY, SYNODIC_DAYS } from '../utils/astro.js';
import { SLOT_COLORS, SLOT_LETTERS } from '../data/sites.js';

const TICKS = [0, 5, 10, 15, 20, 25, 29.5];

function ChartTip({ active, payload, label, baseEpoch, names, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/15 bg-[#0a0f1f]/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-white mb-1">{formatUtc(baseEpoch + label * MS_DAY)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2" style={{ color: p.stroke }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          <span className="text-slate-200">{names[Number(p.dataKey.slice(1))]}:</span>
          <span className="font-bold">
            {Number(p.value).toFixed(1)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TimelineChart({ sites, baseEpoch, offset }) {
  const [metric, setMetric] = useState('margin');
  const [focus, setFocus] = useState(0);

  const siteKey = sites.map((s) => `${s.id}|${s.lat}|${s.lon}`).join('~');
  const timelines = useMemo(
    () => sites.map((s) => buildTimeline(s, baseEpoch)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteKey, baseEpoch]
  );

  const rows = useMemo(
    () =>
      timelines[0].points.map((p, i) => {
        const row = { day: p.day };
        timelines.forEach((t, j) => {
          row[`s${j}`] = t.points[i][metric];
        });
        return row;
      }),
    [timelines, metric]
  );

  const names = sites.map((s) => s.name);
  const unit = metric === 'power' ? '%' : '°';
  const focusEvents = timelines[Math.min(focus, timelines.length - 1)].events;

  return (
    <section className="glass p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Lunar Day Timeline</h2>
          <p className="text-sm text-slate-400 mt-1">
            {metric === 'margin'
              ? 'Sun height above each site’s local terrain horizon over 29.53 days. Above zero means sunlit.'
              : 'Share of peak solar power over 29.53 days.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/15 p-0.5 text-xs">
            {[
              ['margin', 'Sun Elevation'],
              ['power', 'Power %'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`rounded-full px-3 py-1.5 font-semibold transition ${
                  metric === key ? 'bg-yellow-400 text-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* legend / focus chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {sites.map((s, j) => (
          <button
            key={j}
            onClick={() => setFocus(j)}
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition"
            style={{
              borderColor: focus === j ? SLOT_COLORS[j] : 'rgba(255,255,255,0.15)',
              background: focus === j ? `${SLOT_COLORS[j]}22` : 'transparent',
              color: focus === j ? '#fff' : '#cbd5e1',
            }}
            title="Show sunrise/sunset markers for this site"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SLOT_COLORS[j] }} />
            {SLOT_LETTERS[j]} · {s.name}
          </button>
        ))}
        <span className="ml-auto hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400 border border-white" /> Sunrise
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400 border border-white" /> Sunset
          </span>
        </span>
      </div>

      <div className="mt-4 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="day"
              domain={[0, SYNODIC_DAYS]}
              ticks={TICKS}
              tickFormatter={(d) => formatShortDate(baseEpoch + d * MS_DAY)}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              width={46}
              tickFormatter={(v) => `${Math.round(v * 10) / 10}${unit}`}
              domain={
                metric === 'power'
                  ? [0, 100]
                  : [(min) => Math.floor(min - 0.5), (max) => Math.ceil(max + 0.5)]
              }
              allowDecimals={false}
            />
            <Tooltip content={<ChartTip baseEpoch={baseEpoch} names={names} unit={unit} />} />
            {metric === 'margin' && (
              <ReferenceLine
                y={0}
                stroke="#ffffff"
                strokeDasharray="5 4"
                strokeOpacity={0.7}
                label={{ value: 'Horizon', fill: '#e2e8f0', fontSize: 11, position: 'insideBottomLeft' }}
              />
            )}
            {timelines.map((_, j) => (
              <Line
                key={j}
                type="linear"
                dataKey={`s${j}`}
                stroke={SLOT_COLORS[j]}
                strokeWidth={focus === j ? 3 : 1.6}
                strokeOpacity={focus === j ? 1 : 0.55}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            {focusEvents.map((e, i) => (
              <ReferenceDot
                key={`${e.type}-${i}`}
                x={e.day}
                y={0}
                r={5}
                fill={e.type === 'sunrise' ? '#facc15' : '#f87171'}
                stroke="#fff"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
            ))}
            <ReferenceLine
              x={Math.min(offset, SYNODIC_DAYS)}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeDasharray="2 3"
              label={{ value: 'Mission time', fill: '#fff', fontSize: 11, position: 'insideTopRight' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
