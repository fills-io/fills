import CardBrackets from "./CardBrackets";

const PERSONAS = [
  {
    label: "01 / The Renter",
    code: "Project · 023B",
    quote: "I want my place to feel like me without losing my deposit.",
    outcome: "A no-paint, no-remodel palette and furniture brief, in five minutes.",
  },
  {
    label: "02 / The Homeowner",
    code: "Project · 047A",
    quote: "I've been saving images for two years and I still don't know what I want.",
    outcome: "Eight design dimensions resolved into a single brief your contractor can quote from.",
  },
  {
    label: "03 / The Host",
    code: "Project · 156F",
    quote: "I'm furnishing a new short-let property and I have a budget.",
    outcome: "A complete furnishing plan with sourcing notes, ready for a single afternoon's ordering.",
  },
  {
    label: "04 / The Architect",
    code: "Project · 084C",
    quote: "I need to brief a residential client tomorrow morning.",
    outcome: "A studio-grade brief PDF in ten minutes, ready to walk them through over coffee.",
  },
  {
    label: "05 / The Interior Designer",
    code: "Project · 211D",
    quote: "My mood boards keep losing the client between vibe and execution.",
    outcome: "A brief that holds vibe and spec together, exportable in your studio's colors.",
  },
  {
    label: "06 / The Studio Lead",
    code: "Project · 332K",
    quote: "We're pitching a hospitality concept on Friday.",
    outcome: "A complete pitch deck of palette, materials, lighting, and references, end of day.",
  },
];

export default function MadeFor() {
  return (
    <section
      id="made-for"
      className="grid grid-cols-1 border-b border-bdr lg:grid-cols-[1fr_1.6fr]"
    >
      {/* Dark left side */}
      <div className="relative overflow-hidden bg-dark px-10 py-20 lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,196,176,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,196,176,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc">
            <span className="inline-block h-px w-6 bg-acc" />
            06 · Made for
          </span>
          <h2 className="mt-5 font-serif text-[clamp(28px,3.4vw,40px)] font-normal leading-[1.12] tracking-tight text-hero-cream">
            Made for the brief you actually have.
          </h2>
          <p className="mt-3 font-serif text-[clamp(18px,2vw,22px)] italic text-hero-cream-2">
            Six projects.{" "}
            <span className="text-acc">Six clear briefs</span>.
          </p>
          <p className="mt-5 max-w-md text-[13px] leading-[1.85] font-light text-hero-cream-2">
            Same studio process behind every one. Different starting points, the same shape of output. Whatever you&apos;re working on, the brief comes out shaped to fit the project.
          </p>
        </div>
      </div>

      {/* Light persona grid */}
      <div className="grid grid-cols-1 gap-3 bg-bg p-3 md:grid-cols-2">
        {PERSONAS.map((p) => (
          <article
            key={p.label}
            className="group relative border border-bdr-2 bg-bg-2 p-8 transition duration-200 hover:-translate-y-0.5 hover:border-acc"
          >
            <CardBrackets />

            <div className="mb-6 flex items-baseline justify-between">
              <span className="font-mono text-[10px] tracking-[0.14em] text-txt-3">
                {p.label}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
                {p.code}
              </span>
            </div>
            <p className="mb-5 font-serif text-lg italic leading-[1.5] text-txt">
              &ldquo;{p.quote}&rdquo;
            </p>
            <p className="text-[12.5px] leading-[1.7] text-txt-2">
              {p.outcome}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
