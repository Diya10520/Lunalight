const SOURCES = [
  {
    name: 'JPL Horizons System',
    use: 'Sun and Earth ephemeris (positions and libration)',
    href: 'https://ssd.jpl.nasa.gov/horizons/',
    color: '#facc15',
  },
  {
    name: 'LOLA (Lunar Orbiter Laser Altimeter)',
    use: 'Topography for horizon masking and shadow modelling',
    href: 'https://lola.gsfc.nasa.gov/',
    color: '#60a5fa',
  },
  {
    name: 'Moon Trek / Quickmap',
    use: 'Site coordinates and surface context',
    href: 'https://trek.nasa.gov/moon/',
    color: '#a78bfa',
  },
  {
    name: 'NASA CLPS Program',
    use: 'Commercial Lunar Payload Services mission context',
    href: 'https://www.nasa.gov/commercial-lunar-payload-services/',
    color: '#2dd4bf',
  },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 pt-8 pb-10">
      <h2 className="text-lg font-bold">NASA Data Sources</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.07]"
          >
            <div className="h-1 w-8 rounded-full" style={{ background: s.color }} />
            <div className="mt-3 font-semibold leading-snug group-hover:underline">{s.name}</div>
            <div className="mt-1 text-xs text-slate-400 leading-snug">{s.use}</div>
          </a>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-500 leading-relaxed max-w-3xl">
        LunaLight is a hackathon MVP built on a simplified ephemeris and a stylised terrain mask. It is for
        comparison and education, not for flight operations. The production version plugs in the JPL Horizons API
        and LOLA digital elevation models for true horizon masking.
      </p>
      <p className="mt-2 text-xs text-slate-600"></p>
    </footer>
  );
}
