const QA = [
  {
    icon: '🌑',
    q: 'Why is it dark here even though it is daytime on Earth?',
    a: 'Day and night on the Moon have nothing to do with the clock on Earth. The Moon turns once every 29.5 Earth days, so a lunar day is about two weeks of light followed by two weeks of dark. At the poles it is trickier: the Moon’s axis is almost straight up (tilted only 1.5°), so the Sun just skims the horizon, and any ridge or crater wall can block it completely.',
  },
  {
    icon: '🌅',
    q: 'Why are South Pole shadows so long?',
    a: 'The Sun never climbs more than about 1.5° above the horizon there. It is like the last minutes before sunset on Earth, except it never ends. Low light means huge shadows: a 1 km ridge casts a shadow about 38 km long (height ÷ tan 1.5°). Some crater floors have not seen sunlight in billions of years, which is why they can hold ice.',
  },
  {
    icon: '🌍',
    q: 'Why can some sites see Earth and others cannot?',
    a: 'The Moon always shows the same face to Earth (tidal locking), so from the Near Side Earth hangs almost still in the sky, and from the Far Side it never rises. Near the poles Earth sits right on the horizon and bobs up and down by about ±2° as the Moon wobbles (libration). A small hill is enough to cut the radio link.',
  },
];

const VERDICTS = [
  { label: 'GO', color: '#22c55e', text: 'Sun and Earth both above the horizon. Power and a direct-to-Earth link.' },
  { label: 'CAUTION', color: '#eab308', text: 'Sun is up but Earth is not. Power works, communications need a relay.' },
  { label: 'NO-GO', color: '#ef4444', text: 'Sun is below the horizon. No solar power.' },
];

export default function EducationPanel() {
  return (
    <section className="glass p-5 sm:p-6 border-sky-400/30">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎓</span>
        <div>
          <h2 className="text-xl font-bold">Education Mode</h2>
          <p className="text-sm text-slate-400">The Moon&apos;s South Pole, explained without the jargon.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {QA.map((item) => (
          <div key={item.q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-2xl">{item.icon}</div>
            <h3 className="mt-2 font-bold leading-snug">{item.q}</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {VERDICTS.map((v) => (
          <div
            key={v.label}
            className="rounded-2xl p-4"
            style={{ background: `${v.color}1f`, border: `1px solid ${v.color}66` }}
          >
            <div className="text-2xl font-black" style={{ color: v.color }}>
              {v.label}
            </div>
            <p className="mt-1 text-sm text-slate-200 leading-snug">{v.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
