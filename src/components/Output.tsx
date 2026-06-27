import SectionHeader from "./SectionHeader";
import CardBrackets from "./CardBrackets";

const OUTPUT_CARDS = [
  {
    num: "01",
    title: "Palette",
    desc: "A six-color system with usage notes for walls, accents, and soft furnishings.",
    visual: (
      <svg viewBox="0 0 220 44" width="100%" height="44" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="35" height="44" fill="#E8DCC8" />
        <rect x="37" y="0" width="35" height="44" fill="#D4C2A3" />
        <rect x="74" y="0" width="35" height="44" fill="#A89890" />
        <rect x="111" y="0" width="35" height="44" fill="#C8512A" />
        <rect x="148" y="0" width="35" height="44" fill="#1A1714" />
        <rect x="185" y="0" width="35" height="44" fill="#F0D5C4" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Materials",
    desc: "Specified surfaces with finish, texture, and reference sources.",
    visual: (
      <div className="flex h-11 gap-1">
        <div className="flex-1 bg-gradient-to-br from-[#D4C2A3] to-[#A89890]" title="Plaster" />
        <div className="flex-1 bg-gradient-to-br from-[#8B6F47] to-[#5C4730]" title="Oak" />
        <div className="flex-1 bg-gradient-to-br from-[#E0D4BE] to-[#B8A888]" title="Travertine" />
      </div>
    ),
  },
  {
    num: "03",
    title: "Lighting",
    desc: "A layered plan covering ambient, task, and accent light.",
    visual: (
      <svg viewBox="0 0 200 90" width="100%" height="44" stroke="currentColor" fill="none" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" className="text-txt-3">
        <line x1="10" y1="8" x2="190" y2="8" />
        <path d="M55 8 L48 26 L62 26 Z" />
        <path d="M125 8 L118 26 L132 26 Z" />
        <line x1="90" y1="8" x2="90" y2="42" />
        <circle cx="90" cy="46" r="4" />
        <line x1="30" y1="82" x2="30" y2="56" />
        <ellipse cx="30" cy="52" rx="6" ry="3" />
        <line x1="180" y1="50" x2="166" y2="50" />
        <line x1="10" y1="82" x2="190" y2="82" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Furniture",
    desc: "Shape language and reference pieces, not a shopping list.",
    visual: (
      <div className="flex h-11 items-center justify-center gap-3">
        <svg viewBox="0 0 60 60" width="36" height="36" stroke="currentColor" fill="none" strokeWidth="1.1" strokeLinejoin="round" className="text-txt-3">
          <path d="M10 50 L10 26 Q10 18 18 18 L42 18 Q50 18 50 26 L50 50" />
          <path d="M16 50 L16 36 L44 36 L44 50" />
        </svg>
        <svg viewBox="0 0 60 60" width="36" height="36" stroke="currentColor" fill="none" strokeWidth="1.1" strokeLinejoin="round" className="text-txt-3">
          <line x1="12" y1="22" x2="48" y2="22" />
          <line x1="14" y1="22" x2="14" y2="52" />
          <line x1="46" y1="22" x2="46" y2="52" />
        </svg>
        <svg viewBox="0 0 60 60" width="36" height="36" stroke="currentColor" fill="none" strokeWidth="1.1" strokeLinejoin="round" className="text-txt-3">
          <path d="M22 14 L38 14 L42 26 L18 26 Z" />
          <line x1="30" y1="26" x2="30" y2="52" />
        </svg>
      </div>
    ),
  },
  {
    num: "05",
    title: "Spatial notes",
    desc: "Flow, proportion, and sight lines when you upload a layout.",
    visual: (
      <svg viewBox="0 0 200 100" width="100%" height="44" stroke="currentColor" fill="none" strokeWidth="1" strokeLinejoin="round" className="text-txt-3">
        <rect x="10" y="20" width="100" height="70" />
        <rect x="115" y="40" width="75" height="50" />
        <path d="M40 60 Q80 60 130 65" strokeDasharray="3 2" />
        <path d="M124 60 L132 65 L124 70" />
        <circle cx="180" cy="14" r="5" />
      </svg>
    ),
  },
];

export default function Output() {
  return (
    <section id="output" className="border-b border-bdr bg-bg px-8 py-[104px]">
      <SectionHeader
        eyebrow="02 · The Output"
        headline="Designer-grade output, in five minutes."
        sub={
          <>
            Built by an architect, sized for{" "}
            <span className="text-acc">anyone with walls</span>.
          </>
        }
        lead="Fills is a mood board generator for interior design and architecture, designed by a working architect and trained on how senior studios brief clients. Describe your project, and in five minutes you get a complete editorial brief: palette, materials, lighting, furniture, spatial notes."
      />

      <div className="mx-auto mt-16 grid max-w-[1280px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {OUTPUT_CARDS.map((card) => (
          <article
            key={card.num}
            className="group relative border border-bdr-2 bg-bg-2 p-8 transition duration-200 hover:-translate-y-0.5 hover:border-acc"
          >
            <CardBrackets />
            <div className="mb-5 font-mono text-[10px] tracking-[0.14em] text-txt-3">
              {card.num}
            </div>
            <div className="mb-6 flex h-11 items-center">{card.visual}</div>
            <h3 className="mb-2 font-serif text-xl font-medium text-txt">
              {card.title}
            </h3>
            <p className="text-[12.5px] leading-[1.7] text-txt-2">
              {card.desc}
            </p>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-16 max-w-2xl text-center text-[13px] leading-[1.85] font-light text-txt-2">
        Landscape or portrait, digital link or PDF, white-label with your studio&apos;s logo. Send it to a contractor, an architect, or your{" "}
        <em className="not-italic font-medium text-acc">group chat</em>.
      </p>
    </section>
  );
}
