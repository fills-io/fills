"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import DevicePreview from "./DevicePreview";
import FillsLogo from "./FillsLogo";

const navLinks = [
  { label: "Platform", href: "/#how" },
  { label: "Showcase", href: "/#samples" },
  { label: "Who it's for", href: "/#made-for" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-bdr backdrop-blur-md"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="flex h-[60px] items-center justify-between pl-4 sm:pl-8">
        {/* Brand wordmark */}
        <Link
          href="/"
          className="flex items-center"
          onClick={close}
          aria-label="Fills.io home"
        >
          <FillsLogo size={22} />
        </Link>

        {/* Desktop nav links — hidden on small screens */}
        <div className="hidden lg:flex">
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

        {/* Right cluster: theme toggle + auth + mobile menu button */}
        <div className="flex items-center border-l border-bdr">
          <ThemeToggle />
          <DevicePreview />
          <Link
            href="/talk-to-a-designer"
            className="hidden h-[60px] items-center whitespace-nowrap border-l border-bdr px-5 text-xs text-txt-2 transition hover:bg-bg-2 hover:text-txt lg:flex"
          >
            Talk to a designer
          </Link>
          <Link
            href="/concept/wizard"
            className="flex h-[60px] items-center whitespace-nowrap border-l border-bdr bg-acc px-4 text-xs font-medium text-white transition hover:bg-acc-d sm:px-6"
          >
            Get started →
          </Link>
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="flex h-[60px] w-[52px] items-center justify-center border-l border-bdr text-txt-2 transition hover:bg-bg-2 hover:text-txt lg:hidden"
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 5h14M2 9h14M2 13h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div
          className="border-t border-bdr lg:hidden"
          style={{ background: "var(--nav-bg)" }}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="block border-b border-bdr px-6 py-3.5 text-sm text-txt-2 transition hover:bg-bg-2 hover:text-txt"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/talk-to-a-designer"
            onClick={close}
            className="block border-b border-bdr px-6 py-3.5 text-sm text-txt-2 transition hover:bg-bg-2 hover:text-txt"
          >
            Talk to a designer
          </Link>
        </div>
      )}
    </nav>
  );
}
