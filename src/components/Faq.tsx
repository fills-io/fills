"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";

const QUESTIONS = [
  {
    q: "Is the output actually usable, or just a vibe?",
    a: "Both. Your design plan (a brief) covers eight parts: colors, materials, lighting, furniture, ceiling, flooring, spatial notes, and overall vibe. Each one comes with real reference images you can buy, build, or copy. It's the same shape senior studios deliver to clients.",
  },
  {
    q: "Do I need to know design language to use this?",
    a: "No. You point at images that feel right. The engine handles the design language: the names of styles, the material details, the technical terms. You walk in with taste and walk out with a plan.",
  },
  {
    q: "How is this different from saving images myself?",
    a: "Saving images gives you a wall of vibes. A plan turns that wall into eight specific parts a contractor or designer can quote against. Same starting taste, structured output.",
  },
  {
    q: "Will my contractor be able to work from the plan?",
    a: "Yes. Every plan includes named materials with where each one goes, a palette with the same notes, a lighting plan down to colour temperature, and reference images per part. The written plan lives on a permanent link you can send, and the reference deck exports as a PDF you can hand over directly.",
  },
  {
    q: "Can designers send the plan to clients?",
    a: "Yes, and many do. The brief is structured the way studios already brief clients: same shape, same depth. You can add your studio's logo to the deck's cover before you hand it over.",
  },
  {
    q: "How long does a plan actually take?",
    a: "From a minute to ten, depending on which door you pick. Drop a few photos you love and we read their colours in about a minute, then you carry that palette into Quick. Pick three things in Quick mode and it's about five. Step through every part yourself in Full Studio and you're around ten.",
  },
  {
    q: "What if I don't like what gets generated?",
    a: "Swap any reference, redo any single part. The plan stays consistent without restarting from scratch. If you want a different overall direction, change one of your three picks and the engine rebuilds around it.",
  },
  {
    q: "Who built this?",
    a: "A working architect who's spent years briefing clients across residential, hospitality, and commercial work. The engine follows the way senior studios actually scope a project: concept, palette, materials, furniture, lighting, then what to confirm on site.",
  },
  {
    q: "What formats and customization options are available?",
    a: "PDF or shareable digital link. The PDF comes as 16:9 slides or A4 portrait. Add your own logo to the cover when you send it to clients.",
  },
];

// The lead used to say "Eight" long after a ninth question was added. Spelling
// the count out from the array itself means it can't drift again.
const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const COUNT_WORD = COUNT_WORDS[QUESTIONS.length] ?? String(QUESTIONS.length);

/**
 * FAQPage structured data, derived from QUESTIONS so the rich result can never
 * drift from what the page actually says. Only the answers currently written
 * above are eligible — Google drops the whole block if the two disagree.
 */
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QUESTIONS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-bdr bg-bg-2 px-6 py-[104px] sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <SectionHeader
        eyebrow="07 · Questions"
        headline="Things people ask."
        lead={`${COUNT_WORD} quick answers from the people who built this.`}
      />

      <div className="mx-auto mt-14 max-w-3xl divide-y divide-bdr border-y border-bdr">
        {QUESTIONS.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-6 py-6 text-left transition hover:bg-bg"
              >
                <span className="font-mono text-[10px] tracking-[0.14em] text-txt-3">
                  Q.{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-serif text-base font-medium text-txt md:text-lg">
                  {item.q}
                </span>
                <span
                  className={`text-acc transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="pb-6 pl-4 pr-4 sm:pl-[80px] sm:pr-10">
                  <p className="text-[13px] leading-[1.85] text-txt-2">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
