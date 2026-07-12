import Link from "next/link";

/**
 * PickYourDoor — the dark "Pick your door" closer (ported from v40).
 *
 * On a dark surface (matching the reference) so the three start-cards read
 * clearly — the previous cream-on-cream version washed out the two
 * outline-only doors. Quick is the tinted "Recommended" card. All four
 * corner brackets fade in on hover; the CTA arrow nudges right.
 *
 * Routes: Quick → the QuickFlow, Upload → the upload path, Full Studio →
 * the existing detailed wizard.
 */

const DOORS = [
  {
    tag: "Recommended",
    label: "Quick · 5 min",
    desc: "Pick three things, we fill in five more. The fastest way to a finished design plan (a brief).",
    cta: "Try Quick",
    href: "/concept/wizard",
    primary: true,
  },
  {
    tag: null,
    label: "Upload · 1 min",
    desc: "Drop a reference image and we build the plan from it automatically. Start to finish in about a minute.",
    cta: "Upload images",
    href: "/concept/wizard",
    primary: false,
  },
  {
    tag: null,
    label: "Full Studio · 10 min",
    desc: "Step through every part yourself. No auto-fill, every choice is yours.",
    cta: "Open Studio",
    href: "/concept/wizard",
    primary: false,
  },
];

export default function PickYourDoor() {
  return (
    <section className="border-b border-[rgba(232,196,176,0.1)] bg-dark px-6 pb-[104px] pt-[88px] sm:px-8">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-9 text-center">
          <span className="inline-flex items-center gap-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-hero-cream-2">
            <span className="inline-block h-px w-[18px] bg-[rgba(232,196,176,0.2)]" />
            08 · Three ways to start
            <span className="inline-block h-px w-[18px] bg-[rgba(232,196,176,0.2)]" />
          </span>
          <h3 className="mt-3 font-serif text-[clamp(28px,3.6vw,40px)] font-medium leading-[1.2] tracking-tight text-hero-cream">
            Pick your door.
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {DOORS.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className={`group relative flex min-h-[200px] flex-col gap-3.5 border p-[26px_22px_24px] transition hover:-translate-y-[3px] ${
                d.primary
                  ? "border-[rgba(200,81,42,0.35)] bg-[rgba(200,81,42,0.08)] hover:bg-[rgba(200,81,42,0.12)]"
                  : "border-[rgba(232,196,176,0.13)] bg-dark-2 hover:border-acc hover:bg-dark-3"
              }`}
            >
              {/* Four corner brackets — fade in on hover */}
              <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l border-t border-acc opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 border-r border-t border-acc opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b border-l border-acc opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r border-acc opacity-0 transition-opacity group-hover:opacity-100" />

              {d.tag && (
                <span className="absolute -top-[9px] right-3.5 bg-acc px-2 py-[3px] font-mono text-[9px] uppercase tracking-[0.14em] text-white">
                  {d.tag}
                </span>
              )}

              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-acc">
                {d.label}
              </span>
              <p className="flex-1 text-[13.5px] leading-[1.55] text-hero-cream-2">
                {d.desc}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 border-t border-[rgba(232,196,176,0.13)] pt-3.5 text-[14px] font-semibold text-hero-cream transition group-hover:text-acc">
                {d.cta}
                <span className="text-acc transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
