/**
 * 404. Reached by a bad link, an old URL, or a saved brief whose token no
 * longer resolves — so it points at the two things that are always useful:
 * start a brief, or go home.
 */

import Link from "next/link";

export const metadata = { title: "Page not found | Fills" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-20 text-center sm:px-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        404
      </div>
      <h1 className="mt-4 font-serif text-[clamp(26px,4vw,38px)] font-normal leading-[1.15] tracking-tight text-txt">
        That page isn&apos;t here.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-txt-2">
        The link may be old, or slightly mistyped. If you were opening a saved
        brief, check the whole address was copied.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/concept/quick"
          className="border border-acc bg-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-acc-h"
        >
          Start a brief
        </Link>
        <Link
          href="/"
          className="border border-bdr-2 px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
