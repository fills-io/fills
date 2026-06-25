/**
 * PlaceholderScene — a labeled placeholder where a real photo/pin will go.
 *
 * The QuickFlow design uses CSS-gradient "scenes" with line-art overlays.
 * Until real Pinterest/AI imagery is wired in, we render a theme-aware
 * placeholder box: a soft surface, a faint architectural line motif, and
 * the scene label in mono caps. Works in both light and dark themes via
 * the global tokens.
 */

type Props = {
  label?: string;
  pattern?: "arch" | "col" | "window" | "plain";
  /** Tag shown bottom-left, e.g. "IMG.03". */
  tag?: string;
  className?: string;
};

function Motif({ pattern }: { pattern: NonNullable<Props["pattern"]> }) {
  const stroke = "currentColor";
  const common = { stroke, strokeWidth: 1, fill: "none", opacity: 0.5 } as const;
  return (
    <svg
      viewBox="0 0 80 100"
      preserveAspectRatio="xMidYMid meet"
      className="h-2/3 w-2/3 text-acc/40"
      aria-hidden
    >
      {pattern === "arch" && (
        <path d="M20 90 V45 A20 20 0 0 1 60 45 V90" {...common} />
      )}
      {pattern === "col" && (
        <>
          <line x1="30" y1="14" x2="30" y2="90" {...common} />
          <line x1="50" y1="14" x2="50" y2="90" {...common} />
          <line x1="22" y1="14" x2="58" y2="14" {...common} />
          <line x1="22" y1="90" x2="58" y2="90" {...common} />
        </>
      )}
      {pattern === "window" && (
        <>
          <rect x="22" y="16" width="36" height="68" {...common} />
          <line x1="40" y1="16" x2="40" y2="84" {...common} />
          <line x1="22" y1="50" x2="58" y2="50" {...common} />
        </>
      )}
      {pattern === "plain" && (
        <>
          <line x1="16" y1="64" x2="64" y2="64" {...common} />
          <line x1="24" y1="64" x2="24" y2="40" {...common} />
          <line x1="56" y1="64" x2="56" y2="34" {...common} />
        </>
      )}
    </svg>
  );
}

export default function PlaceholderScene({
  label,
  pattern = "plain",
  tag,
  className = "",
}: Props) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-bdr-2 bg-bg-3 ${className}`}
    >
      <Motif pattern={pattern} />
      {label && (
        <span className="absolute left-2 top-2 max-w-[80%] font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
          {label}
        </span>
      )}
      {tag && (
        <span className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.14em] text-txt-3">
          {tag}
        </span>
      )}
      {/* tiny "placeholder" marker bottom-right */}
      <span className="absolute bottom-2 right-2 font-mono text-[7px] uppercase tracking-[0.16em] text-txt-3 opacity-60">
        placeholder
      </span>
    </div>
  );
}
