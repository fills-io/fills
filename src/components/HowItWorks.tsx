import SectionHeader from "./SectionHeader";
import CardBrackets from "./CardBrackets";

const STATIONS = [
  {
    num: "01 / SPACE",
    title: "Tell us about your space.",
    body: "Bedroom, kitchen, cafe, retail floor, whatever you're working on. Add a note if you want, like a moodier feel or who'll be using it. This anchors everything that comes next.",
    visual: (
      <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMid meet" stroke="currentColor" fill="none" strokeWidth="1" strokeLinejoin="round" className="text-txt-2">
        <rect x="28" y="20" width="80" height="46" />
        <line x1="50" y1="20" x2="74" y2="20" strokeWidth="2.5" />
        <line x1="108" y1="42" x2="108" y2="58" />
        <path d="M108 58 A14 14 0 0 0 122 44" strokeDasharray="2 2" />
        <line x1="68" y1="44" x2="148" y2="22" strokeDasharray="1 2" opacity="0.55" />
        <rect x="148" y="14" width="36" height="16" />
      </svg>
    ),
  },
  {
    num: "02 / VIBE",
    title: "Show us what you like.",
    body: "Pick a handful of images that feel right, for the vibe and for the colors. You don't need to know the words for what you want. Just point at what you love.",
    visual: (
      <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMid meet" stroke="currentColor" fill="none" strokeWidth="1" strokeLinejoin="round" className="text-txt-2">
        <rect x="48" y="6" width="22" height="22" />
        <rect x="74" y="6" width="22" height="22" />
        <rect x="100" y="6" width="22" height="22" />
        <rect x="126" y="6" width="22" height="22" />
        <rect x="48" y="32" width="22" height="22" />
        <rect x="74" y="32" width="22" height="22" />
        <rect x="100" y="32" width="22" height="22" />
        <rect x="126" y="32" width="22" height="22" />
        <rect x="48" y="58" width="22" height="22" />
        <rect x="74" y="58" width="22" height="22" />
        <rect x="100" y="58" width="22" height="22" />
        <rect x="126" y="58" width="22" height="22" />
        <path d="M52 11 L57 16 L66 6" stroke="#C8512A" strokeWidth="1.6" fill="none" />
        <path d="M104 37 L109 42 L118 32" stroke="#C8512A" strokeWidth="1.6" fill="none" />
        <path d="M78 63 L83 68 L92 58" stroke="#C8512A" strokeWidth="1.6" fill="none" />
      </svg>
    ),
  },
  {
    num: "03 / BUILD",
    title: "We build out the rest.",
    body: "Furniture, lighting, flooring, ceiling, materials. We do the heavy lifting and pull references for each dimension based on your picks. About fifteen seconds.",
    visual: (
      <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMid meet" stroke="currentColor" fill="none" strokeWidth="0.7" className="text-txt-2">
        {[10, 24, 38, 52, 66].map((y, i) => (
          <g key={y}>
            <line x1="22" y1={y} x2="40" y2={y} />
            <rect x="46" y={y - 4} width="132" height="8" />
            <rect x="46" y={y - 4} width={130 - i * 22} height="8" fill="#C8512A" fillOpacity="0.55" stroke="none" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    num: "04 / REFINE",
    title: "Make it yours.",
    body: "All eight dimensions in front of you. Swap anything you don't love, regenerate anything that's off. Export as a PDF or shareable link, landscape or portrait, with your studio's logo if you need it.",
    visual: (
      <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMid meet" stroke="currentColor" fill="none" strokeWidth="0.9" strokeLinejoin="round" className="text-txt-2">
        <rect x="20" y="10" width="36" height="28" />
        <rect x="60" y="10" width="36" height="28" />
        <rect x="100" y="10" width="36" height="28" />
        <rect x="140" y="10" width="36" height="28" />
        <rect x="20" y="42" width="36" height="28" />
        <rect x="60" y="42" width="36" height="28" />
        <rect x="100" y="42" width="36" height="28" stroke="#C8512A" strokeWidth="1.5" />
        <rect x="140" y="42" width="36" height="28" />
        <circle cx="118" cy="56" r="7" fill="#FFFAF0" stroke="#C8512A" strokeWidth="1" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-b border-bdr bg-bg px-6 py-[104px] sm:px-8">
      <SectionHeader
        eyebrow="04 · How it works"
        headline="From a few choices to a complete brief."
        sub={
          <>
            Eight design dimensions, in{" "}
            <span className="text-acc">five minutes</span>.
          </>
        }
        lead="Fills follows how senior studios actually scope a project. You give a starting direction. We build out the rest. You stay in control of the result."
      />

      {/* Datum thread — a terracotta drafting line connecting the steps */}
      <div className="relative mx-auto mt-16 max-w-[1280px]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-[120px] z-0 hidden items-center lg:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-acc" />
          <span className="h-px flex-1 bg-[repeating-linear-gradient(to_right,var(--acc)_0_6px,transparent_6px_12px)] opacity-50" />
          <span className="h-1.5 w-1.5 rounded-full bg-acc" />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STATIONS.map((s) => (
            <article
              key={s.num}
              className="group relative border border-bdr-2 bg-bg-2 p-7 transition duration-200 hover:-translate-y-0.5 hover:border-acc"
            >
              <CardBrackets />
              <div className="mb-5 font-mono text-[10px] tracking-[0.14em] text-txt-3">
                {s.num}
              </div>
              <div className="mb-6 grid h-20 place-items-center">{s.visual}</div>
              <h3 className="mb-3 font-serif text-lg font-medium leading-snug text-txt">
                {s.title}
              </h3>
              <p className="text-[12.5px] leading-[1.7] text-txt-2">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
