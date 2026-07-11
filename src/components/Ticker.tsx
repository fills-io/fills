const TICKER_ITEMS = [
  { text: "Mood Board Studio", accent: true },
  { text: "Colour System", accent: false },
  { text: "3D Visualization", accent: true },
  { text: "Pinterest Integration", accent: false },
  { text: "Hand It To Your Designer", accent: true },
  { text: "Material Analysis", accent: false },
  { text: "PDF Export", accent: true },
  { text: "Floor Plans", accent: false },
  { text: "Design Plan Builder", accent: true },
  { text: "Shareable Boards", accent: false },
];

export default function Ticker() {
  // Duplicate the array so the marquee loop is seamless
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="overflow-hidden border-b border-bdr bg-bg py-5">
      <div className="flex animate-marquee gap-12 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em]">
        {items.map((item, i) => (
          <span
            key={i}
            className={item.accent ? "text-acc" : "text-txt-3"}
          >
            {item.text}
            <span className="ml-12 text-bdr-2">·</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
          width: max-content;
        }
      `}</style>
    </div>
  );
}
