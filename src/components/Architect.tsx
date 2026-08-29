import SectionHeader from "./SectionHeader";

const TIERS = [
  {
    num: "01",
    title: "A video call to review your plan.",
    desc: "Once you have your design plan (a brief), book a call with a working architect. Walk them through your mood board, get their take on what's working, and map out the next steps for your project.",
    forWhom: "For a sanity check before you start spending.",
  },
  {
    num: "02",
    title: "Floor plans and elevations.",
    desc: "From your plan, the architect develops flat 2D drawings: layouts, wall views (elevations), key sections. Real architectural drawings ready for a contractor to quote from.",
    forWhom: "For when you have a contractor lined up.",
  },
  {
    num: "03",
    title: "A live spatial review with the architect.",
    desc: "With your plan in hand, schedule a video call. Walk the project in 3D together: layout recommendations, material adjustments, written summary after.",
    forWhom: "For when you need direction without committing to a full design service.",
  },
  {
    num: "04",
    title: "A complete 3D design.",
    desc: "From plan through to the drawings a builder works from. Full 3D modelling, realistic renders, and a build-ready specification. The architect's studio takes the project all the way.",
    forWhom: "For when the project deserves an architect from start to finish.",
  },
];

export default function Architect() {
  return (
    <section
      id="architect"
      className="border-b border-dark-3 bg-dark px-6 py-[104px] sm:px-8"
    >
      <SectionHeader
        eyebrow="03 · Talk to an architect"
        headline="An architect at every step."
        sub={
          <>
            From a sanity check to a{" "}
            <span className="text-acc">full 3D design</span>.
          </>
        }
        lead="Real working architects, on call from inside your project. Once you have your design plan in hand, bring one in for a video call, real drawings, a 3D walkthrough, or a full design service. At the level your project actually needs."
        tone="dark"
      />

      <div className="mx-auto mt-16 max-w-5xl divide-y divide-[rgba(232,196,176,0.13)] border border-[rgba(232,196,176,0.13)]">
        {TIERS.map((tier) => (
          <div
            key={tier.num}
            className="group flex flex-col gap-6 px-6 py-8 transition sm:px-8 hover:bg-[rgba(232,196,176,0.03)] md:flex-row md:items-start"
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-acc md:min-w-[80px] md:pt-1">
              {tier.num}
            </span>
            <div className="flex-1">
              <h3 className="font-serif text-xl font-normal text-hero-cream md:text-[22px]">
                {tier.title}
              </h3>
              <p className="mt-3 max-w-2xl text-[13px] leading-[1.85] font-light text-hero-cream-2">
                {tier.desc}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-hero-dim">
                {tier.forWhom}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-[13px] leading-[1.85] text-hero-cream-2">
        <strong className="font-medium text-hero-cream">
          All four start with the same conversation.
        </strong>{" "}
        Build your plan first, then{" "}
        <a
          href="/talk-to-a-designer"
          className="text-acc underline decoration-acc/40 underline-offset-2 transition hover:decoration-acc"
        >
          tell us about the project
        </a>{" "}
        and an architect replies by email.
      </p>
    </section>
  );
}
