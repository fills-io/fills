const COLUMNS = [
  {
    title: "Platform",
    links: ["Mood board", "Color system", "3D visualization", "Handoff export", "Pricing"],
  },
  {
    title: "For",
    links: [
      "Interior designers",
      "Architects",
      "Homeowners",
      "Restaurants",
      "Retail & Hospitality",
    ],
  },
  {
    title: "Company",
    links: ["About", "Showcase", "Blog", "Contact", "Careers"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-bg-2 px-8 pt-20 pb-6">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="11" height="11" rx="1" fill="#C8512A" />
              <rect x="15" y="2" width="11" height="5" rx="1" fill="currentColor" className="text-txt" />
              <rect x="15" y="9" width="11" height="4" rx="1" fill="currentColor" className="text-txt-3" />
              <rect x="2" y="15" width="5" height="11" rx="1" fill="currentColor" className="text-txt-3" />
              <rect x="9" y="15" width="4" height="11" rx="1" fill="#C8512A" opacity="0.4" />
              <rect x="15" y="15" width="11" height="11" rx="1" fill="currentColor" className="text-txt" />
            </svg>
            <span className="font-medium tracking-tight text-txt">
              Fills<b className="font-medium text-acc">.io</b>
            </span>
          </div>
          <p className="mt-5 max-w-xs text-[13px] leading-[1.7] text-txt-2">
            Where interior design and architecture meet a faster way to brief. Build your concept brief in minutes.
          </p>
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
              {col.title}
            </div>
            <div className="flex flex-col gap-2.5">
              {col.links.map((link) => (
                <a
                  key={link}
                  href={link === "Blog" ? "/blog" : "#"}
                  className="text-[13px] text-txt-2 transition hover:text-acc"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-bdr pt-6 text-[11.5px] text-txt-3 md:flex-row">
        <span>© 2026 Fills Ltd. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="transition hover:text-acc">Privacy</a>
          <a href="#" className="transition hover:text-acc">Terms</a>
          <a href="#" className="transition hover:text-acc">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
