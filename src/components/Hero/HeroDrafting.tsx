/**
 * HeroDrafting — architectural margin marks for the cream hero.
 *
 * Pure SVG/CSS, no JS. Ported from v40's `.hero-drafting` layer:
 *  - top dimension band with tick marks + millimetre callouts
 *  - north arrow (bottom-right)
 *  - scale reference bar (bottom-left)
 *  - A-A section callouts on the left + right edges
 *
 * Reads as drafting ink on cream. Hidden below 740px (desktop detail).
 * Lives behind the hero stage (z-0).
 */

export default function HeroDrafting() {
  const ink = "#9A8770"; // warm graphite that reads as drafting ink on cream

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 hidden md:block"
      style={{ color: ink }}
    >
      {/* Top dimension band */}
      <svg
        className="absolute left-[60px] right-[60px] top-[46px] h-[14px] w-auto"
        style={{ width: "calc(100% - 120px)", opacity: 0.6 }}
        preserveAspectRatio="none"
        viewBox="0 0 1000 14"
      >
        {/* main rule */}
        <line x1="0" y1="7" x2="1000" y2="7" stroke="currentColor" strokeWidth="1" />
        {/* end + division ticks */}
        {[0, 250, 500, 750, 1000].map((x) => (
          <line key={x} x1={x} y1="1" x2={x} y2="13" stroke="currentColor" strokeWidth="1" />
        ))}
        {/* arrow caps at the extents */}
        <path d="M4 7 L10 4 M4 7 L10 10" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M996 7 L990 4 M996 7 L990 10" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      {/* Dimension numbers under the band */}
      <div
        className="absolute left-[60px] right-[60px] top-[30px] flex justify-around font-mono text-[9px] tracking-[0.08em]"
        style={{ opacity: 0.7 }}
      >
        <span>3200</span>
        <span>2800</span>
        <span>2800</span>
        <span>3200</span>
      </div>

      {/* North arrow — bottom-right */}
      <div className="absolute bottom-[60px] right-[48px]" style={{ opacity: 0.8 }}>
        <svg width="34" height="46" viewBox="0 0 34 50" fill="none">
          <circle cx="17" cy="20" r="15" stroke="currentColor" strokeWidth="1" />
          <path d="M17 7 L21 22 L17 18 L13 22 Z" fill="currentColor" />
          <text
            x="17"
            y="44"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="currentColor"
          >
            N
          </text>
        </svg>
      </div>

      {/* Scale reference — bottom-left */}
      <div
        className="absolute bottom-[54px] left-[48px] w-[84px] font-mono text-[8px] tracking-[0.1em]"
        style={{ opacity: 0.85 }}
      >
        <span className="mb-1 block text-center tracking-[0.14em]">SCALE 1:50</span>
        <svg className="block h-2 w-full" viewBox="0 0 84 8" preserveAspectRatio="none">
          <rect x="0" y="0" width="21" height="8" fill="currentColor" opacity="0.85" />
          <rect x="21" y="0" width="21" height="8" fill="none" stroke="currentColor" strokeWidth="0.75" />
          <rect x="42" y="0" width="21" height="8" fill="currentColor" opacity="0.85" />
          <rect x="63" y="0" width="21" height="8" fill="none" stroke="currentColor" strokeWidth="0.75" />
        </svg>
        <div className="mt-[3px] flex justify-between">
          <span>0</span>
          <span>2m</span>
        </div>
      </div>

      {/* A-A section callouts — left + right edges, vertical center */}
      <div className="absolute left-6 top-1/2 flex -translate-y-1/2 items-center gap-1.5" style={{ opacity: 0.5 }}>
        <span
          className="h-px w-[60px]"
          style={{
            backgroundImage: "linear-gradient(to right, currentColor 50%, transparent 50%)",
            backgroundSize: "8px 1px",
          }}
        />
        <span className="font-mono text-[9px] tracking-[0.1em]">A</span>
      </div>
      <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-row-reverse items-center gap-1.5" style={{ opacity: 0.5 }}>
        <span
          className="h-px w-[60px]"
          style={{
            backgroundImage: "linear-gradient(to right, currentColor 50%, transparent 50%)",
            backgroundSize: "8px 1px",
          }}
        />
        <span className="font-mono text-[9px] tracking-[0.1em]">A</span>
      </div>
    </div>
  );
}
