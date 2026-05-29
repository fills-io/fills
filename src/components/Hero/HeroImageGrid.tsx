/**
 * HeroImageGrid — dark-mode bracketed "scene" squares (ported from v40).
 *
 * Six low-fi CSS-art architectural scenes (warm room, plaster wall, arch,
 * velvet, travertine, light study) framed with thin L-brackets, pushed to
 * the hero edges so the center stage stays clear. Dark-mode only — hidden
 * in light mode (the cream hero uses drafting margins instead).
 *
 * Pure CSS, no JS. A radial mask fades the squares toward the center.
 */

const SCENES: Record<string, string> = {
  warm: "linear-gradient(165deg,#2A1D14 0%,#4A3024 55%,#6B4A35 100%)",
  plaster: "linear-gradient(180deg,#6B5C4A 0%,#4A3E32 70%,#2E2620 100%)",
  arch: "linear-gradient(160deg,#2E2520 0%,#4A3D32 100%)",
  velvet: "linear-gradient(180deg,#4A2435 0%,#2A1420 100%)",
  travertine: "linear-gradient(135deg,#C8B898 0%,#E0D4BE 40%,#B8A888 70%,#D8C8A8 100%)",
  light: "radial-gradient(circle at 28% 32%,rgba(248,224,184,.55),rgba(60,42,30,.4) 45%,#1E1814 75%)",
};

/** A single bracketed scene square. */
function Square({
  scene,
  tag,
  className,
}: {
  scene: keyof typeof SCENES;
  tag: string;
  className: string;
}) {
  return (
    <div className={`group absolute ${className}`}>
      {/* scene */}
      <div className="absolute inset-0 overflow-hidden border border-[rgba(232,220,204,0.18)]">
        <div className="absolute inset-0" style={{ background: SCENES[scene] }} />
        {/* dim overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,23,20,0.35)] to-[rgba(26,23,20,0.65)]" />
      </div>
      {/* L-bracket corners */}
      <span className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 border-l border-t border-[rgba(232,220,204,0.4)]" />
      <span className="absolute -right-[5px] -top-[5px] h-2.5 w-2.5 border-r border-t border-[rgba(232,220,204,0.4)]" />
      <span className="absolute -bottom-[5px] -left-[5px] h-2.5 w-2.5 border-b border-l border-[rgba(232,220,204,0.4)]" />
      <span className="absolute -bottom-[5px] -right-[5px] h-2.5 w-2.5 border-b border-r border-[rgba(232,220,204,0.4)]" />
      {/* meta tag on hover */}
      <span className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[rgba(240,234,226,0.7)] opacity-0 transition-opacity group-hover:opacity-100">
        {tag}
      </span>
    </div>
  );
}

export default function HeroImageGrid() {
  return (
    <div
      aria-hidden
      className="hero-image-grid pointer-events-none absolute inset-0 z-[1] hidden opacity-[0.36] md:block"
      style={{
        WebkitMaskImage:
          "radial-gradient(ellipse 55% 60% at center, transparent 0%, rgba(0,0,0,.4) 50%, #000 90%)",
        maskImage:
          "radial-gradient(ellipse 55% 60% at center, transparent 0%, rgba(0,0,0,.4) 50%, #000 90%)",
      }}
    >
      {/* corners — left column, right column */}
      <Square scene="warm" tag="Warm Room · IMG.01" className="left-[40px] top-[70px] h-[150px] w-[200px]" />
      <Square scene="plaster" tag="Plaster · IMG.02" className="bottom-[80px] left-[60px] h-[150px] w-[200px]" />
      <Square scene="arch" tag="Threshold · IMG.03" className="right-[40px] top-[70px] h-[150px] w-[200px]" />
      <Square scene="velvet" tag="Lounge · IMG.04" className="bottom-[150px] right-[60px] h-[140px] w-[190px]" />
      <Square scene="travertine" tag="Travertine · IMG.05" className="bottom-[40px] right-[200px] h-[120px] w-[160px]" />
      <Square scene="light" tag="Light Study · IMG.06" className="right-[280px] top-[90px] h-[120px] w-[160px]" />
    </div>
  );
}
