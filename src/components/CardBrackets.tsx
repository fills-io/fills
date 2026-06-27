/**
 * CardBrackets — the single, shared corner-bracket frame used on every card
 * across the site. Four L-corners in the accent color that fade in on hover.
 *
 * Parent must be `relative` and `group`. This replaces the three different
 * bespoke bracket treatments that had drifted across sections (the main
 * "looks AI-generated" tell — now one frame, one behavior, everywhere).
 */
export default function CardBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l border-t border-acc opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 border-r border-t border-acc opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b border-l border-acc opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r border-acc opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
    </>
  );
}
