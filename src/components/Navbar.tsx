"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import DevicePreview from "./DevicePreview";

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
        {/* Logo — v40 moodboard swatch-stack mark */}
        <Link href="/" className="flex items-center gap-3" onClick={close}>
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
          <button className="hidden h-[60px] whitespace-nowrap border-l border-bdr px-5 text-xs text-txt-2 transition hover:bg-bg-2 hover:text-txt lg:block">
            Sign in
          </button>
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
          <button className="block w-full px-6 py-3.5 text-left text-sm text-txt-2 transition hover:bg-bg-2 hover:text-txt">
            Sign in
          </button>
        </div>
      )}
    </nav>
  );
}
