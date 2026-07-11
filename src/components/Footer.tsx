import FillsLogo from "./FillsLogo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Design plan (brief)", href: "/#output" },
      { label: "Mood board & colours", href: "/#output" },
      { label: "Examples", href: "/#samples" },
      { label: "Free brief template", href: "/interior-design-brief-template" },
      { label: "Start a plan", href: "/concept/wizard" },
    ],
  },
  {
    title: "For",
    links: [
      { label: "Interior designers", href: "/#made-for" },
      { label: "Architects", href: "/#made-for" },
      { label: "Homeowners", href: "/#made-for" },
      { label: "Retail & commercial", href: "/#made-for" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "The architect", href: "/#architect" },
      { label: "Talk to a designer", href: "/talk-to-a-designer" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-bg-2 px-6 pt-20 pb-6 sm:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Brand column */}
        <div>
          <div className="flex items-center">
            <FillsLogo size={24} />
          </div>
          <p className="mt-5 max-w-xs text-[13px] leading-[1.7] text-txt-2">
            Where interior design and architecture meet a faster way to plan a space. Build your design plan in minutes.
          </p>
          <div className="mt-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
              On the roadmap
            </div>
            <p className="mt-1.5 text-[12px] text-txt-2">
              Layout · Visualization · Full design service · Budget &amp; shopping list (BOQ)
            </p>
          </div>
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
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-txt-2 transition hover:text-acc"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl items-center justify-between gap-4 border-t border-bdr pt-6 text-[11.5px] text-txt-3">
        <span>© 2026 Fills Ltd. All rights reserved.</span>
        <a href="/blog" className="transition hover:text-acc">
          Blog
        </a>
      </div>
    </footer>
  );
}
