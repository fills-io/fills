/**
 * Fills.io brand wordmark.
 *
 * `fi[caret]s.io` — the double-l is replaced by a bracketed, blinking
 * terracotta caret ("you bring the taste, we fill the blank"). Pure type plus
 * one animated span: crisp at any size, and theme-able via the site's color
 * tokens (letters follow --txt, brackets/caret follow --acc, .io follows the
 * muted --txt-3). The blink respects prefers-reduced-motion (see globals.css).
 *
 * Anatomy & ratios follow the design handoff spec:
 *   letters (fi, s) — weight 800; brackets [ ] — weight 500; .io — 0.44em, muted.
 *   caret height ≈ 0.73·size, width ≈ 0.096·size (min 2px), side margin ≈ 0.11·size.
 */

type Props = {
  /** Wordmark font-size in px. The caret scales from it. */
  size?: number;
  className?: string;
};

export default function FillsLogo({ size = 22, className = "" }: Props) {
  const caretH = +(size * 0.73).toFixed(1);
  const caretW = Math.max(2, +(size * 0.096).toFixed(1));
  const caretM = +(size * 0.11).toFixed(1);

  return (
    <span
      role="img"
      aria-label="Fills.io"
      className={`inline-flex select-none items-center font-extrabold leading-none text-txt ${className}`}
      style={{
        fontFamily: "var(--font-archivo), var(--font-sans), sans-serif",
        fontSize: size,
        letterSpacing: "-0.02em",
      }}
    >
      <span aria-hidden>fi</span>
      <span aria-hidden className="font-medium text-acc">
        [
      </span>
      <span
        aria-hidden
        className="fills-caret inline-block bg-acc"
        style={{ width: caretW, height: caretH, margin: `0 ${caretM}px` }}
      />
      <span aria-hidden className="font-medium text-acc">
        ]
      </span>
      <span aria-hidden>s</span>
      <span
        aria-hidden
        className="font-medium text-txt-3"
        style={{ fontSize: "0.44em", marginLeft: 3 }}
      >
        .io
      </span>
    </span>
  );
}
