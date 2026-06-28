import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Platform", href: "/#how" },
  { label: "Showcase", href: "/#samples" },
  { label: "For designers", href: "/#made-for" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-bdr px-8 backdrop-blur-md"
      style={{ background: "var(--nav-bg)" }}
    >
      {/* Logo — v40 moodboard swatch-stack mark */}
      <Link href="/" className="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden>
          <rect x="2" y="2" width="11" height="11" rx="1" fill="#C8512A" />
          <rect x="15" y="2" width="11" height="5" rx="1" className="fill-txt" />
          <rect x="15" y="9" width="11" height="4" rx="1" className="fill-txt-3" />
          <rect x="2" y="15" width="5" height="11" rx="1" className="fill-txt-3" />
          <rect x="9" y="15" width="4" height="11" rx="1" fill="#C8512A" opacity="0.4" />
          <rect x="15" y="15" width="11" height="11" rx="1" className="fill-txt" />
        </svg>
        <span className="text-sm font-medium tracking-tight text-txt">
          Fills<b className="font-medium text-acc">.io</b>
        </span>
      </Link>

      {/* Nav links — hidden on small screens */}
      <div className="hidden md:flex">
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex h-[60px] items-center border-l border-bdr px-5 text-[11.5px] text-txt-2 transition hover:bg-bg-2 hover:text-txt"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Right cluster: theme toggle + auth */}
      <div className="flex border-l border-bdr">
        <ThemeToggle />
        <button className="h-[60px] border-l border-bdr px-5 text-xs text-txt-2 transition hover:bg-bg-2 hover:text-txt">
          Sign in
        </button>
        <Link
          href="/create?path=quick"
          className="flex h-[60px] items-center border-l border-bdr bg-acc px-6 text-xs font-medium text-white transition hover:bg-acc-d"
        >
          Get started →
        </Link>
      </div>
    </nav>
  );
}
