import { useEffect, useMemo, useState } from 'react';
import CompareCard from './components/CompareCard.jsx';
import TimelineChart from './components/TimelineChart.jsx';
import EducationPanel from './components/EducationPanel.jsx';
import Footer from './components/Footer.jsx';
import {
  CUSTOM_ID,
  DEFAULT_SLOTS,
  SITES,
  SLOT_COLORS,
  SLOT_LETTERS,
  resolveSite,
} from './data/sites.js';
import { MS_DAY, SYNODIC_DAYS, formatUtc, lunarPhase } from './utils/astro.js';

const DEFAULT_DATE = '2026-11-15';
const MOON_EMOJI = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
        <defs>
          <radialGradient id="logoSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="100%" stopColor="#facc15" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#logoSun)" />
        <circle cx="31" cy="19" r="18" fill="#02030a" />
        <circle cx="38" cy="10" r="3.2" fill="#3b82f6" />
      </svg>
      <div className="leading-none">
        <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-200 via-yellow-400 to-sky-400 bg-clip-text text-transparent">
          LunaLight
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Lunar Landing Site Navigator</div>
      </div>
    </div>
  );
}

export default function App() {
  const [date, setDate] = useState(DEFAULT_DATE);
  const [offset, setOffset] = useState(0); // days after the selected date, 0 to 29.5
  const [playing, setPlaying] = useState(false);
  const [edu, setEdu] = useState(false);
  const [slots, setSlots] = useState(DEFAULT_SLOTS.map((id) => ({ id, lat: '-88', lon: '0' })));

  const baseEpoch = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return Date.UTC(2026, 10, 15);
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }, [date]);

  const epoch = baseEpoch + offset * MS_DAY;
  const phase = lunarPhase(epoch);

  const sites = useMemo(
    () => slots.map((s, i) => resolveSite(s, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(slots)]
  );

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      setOffset((o) => {
        const next = Math.round((o + 0.2) * 10) / 10;
        return next > SYNODIC_DAYS ? 0 : next;
      });
    }, 110);
    return () => clearInterval(t);
  }, [playing]);

  const updateSlot = (i, patch) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <>
      <div className="starfield" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-3 py-5">
          <Logo />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEdu((v) => !v)}
              aria-pressed={edu}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                edu
                  ? 'border-sky-400 bg-sky-400/20 text-sky-100'
                  : 'border-white/15 text-slate-200 hover:bg-white/10'
              }`}
            >
              🎓 Education Mode
              <span
                className={`inline-block h-4 w-7 rounded-full p-0.5 transition ${edu ? 'bg-sky-400' : 'bg-white/20'}`}
              >
                <span
                  className={`block h-3 w-3 rounded-full bg-white transition-transform ${edu ? 'translate-x-3' : ''}`}
                />
              </span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
              
            </span>
          </div>
        </header>

        {/* hero */}
        <section className="pt-4 pb-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            Pick the Right Spot.{' '}
            <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
              Power the Mission.
            </span>
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-slate-300 sm:text-lg">
            Compare lunar landing sites side by side. See where the{' '}
            <span className="font-semibold text-yellow-300">Sun</span> and{' '}
            <span className="font-semibold text-blue-400">Earth</span> sit in the sky, and get an instant
            go / no-go for solar power and direct-to-Earth communication.
          </p>
        </section>

        {/* controls */}
        <section className="glass p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_2fr]">
            {/* date + time */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setOffset(0);
                }}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-yellow-400"
              />

              <div className="mt-4 flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-slate-400" htmlFor="time">
                  Lunar day clock
                </label>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black hover:bg-yellow-300"
                >
                  {playing ? '❚❚ Pause' : '▶ Play'}
                </button>
              </div>
              <input
                id="time"
                type="range"
                min="0"
                max={SYNODIC_DAYS}
                step="0.1"
                value={offset}
                onChange={(e) => {
                  setPlaying(false);
                  setOffset(Number(e.target.value));
                }}
                className="mt-2 w-full"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>+0 d</span>
                <span className="font-semibold text-white">+{offset.toFixed(1)} d</span>
                <span>+29.5 d</span>
              </div>
              <div className="mt-3 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm">
                <div className="font-semibold">{formatUtc(epoch)}</div>
                <div className="text-xs text-slate-400">
                  {MOON_EMOJI[phase.idx]} {phase.name} · lunar day {phase.age.toFixed(1)} of 29.5
                </div>
              </div>
            </div>

            {/* site pickers */}
            <div className="grid gap-4 sm:grid-cols-3">
              {slots.map((slot, i) => (
                <div key={i}>
                  <label
                    className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"
                    htmlFor={`site-${i}`}
                  >
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-black text-black"
                      style={{ background: SLOT_COLORS[i] }}
                    >
                      {SLOT_LETTERS[i]}
                    </span>
                    Site {SLOT_LETTERS[i]}
                  </label>
                  <select
                    id={`site-${i}`}
                    value={slot.id}
                    onChange={(e) => updateSlot(i, { id: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
                  >
                    {SITES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value={CUSTOM_ID}>Custom lat / lon…</option>
                  </select>

                  {slot.id === CUSTOM_ID && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-400">
                        Latitude
                        <input
                          type="number"
                          min="-90"
                          max="90"
                          step="0.1"
                          value={slot.lat}
                          onChange={(e) => updateSlot(i, { lat: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-sm text-white outline-none focus:border-yellow-400"
                        />
                      </label>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400">
                        Longitude
                        <input
                          type="number"
                          min="-180"
                          max="180"
                          step="0.1"
                          value={slot.lon}
                          onChange={(e) => updateSlot(i, { lon: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-sm text-white outline-none focus:border-yellow-400"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* comparison cards */}
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site, i) => (
            <CompareCard key={i} site={site} slotIndex={i} epoch={epoch} eduMode={edu} />
          ))}
        </section>

        {/* timeline */}
        <div className="mt-6">
          <TimelineChart sites={sites} baseEpoch={baseEpoch} offset={offset} />
        </div>

        {edu && (
          <div className="mt-6">
            <EducationPanel />
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}
