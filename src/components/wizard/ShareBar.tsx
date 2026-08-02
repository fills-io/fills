"use client";

/**
 * The permanent link to a saved brief, shown above the brief itself.
 *
 * Renders nothing until the save lands, so a slow or failed write never
 * interrupts a brief the user is already reading.
 */

import { useState } from "react";

export default function ShareBar({ token }: { token: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!token) return null;

  const path = `/brief/${token}`;
  const url =
    typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 border border-bdr-2 bg-bg-2 px-4 py-3">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc">
        Saved
      </span>
      <a
        href={path}
        className="min-w-0 flex-1 truncate font-mono text-[11px] text-txt-2 underline underline-offset-2 hover:text-acc"
      >
        {url}
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 border border-bdr-2 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
