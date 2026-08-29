"use client";

/**
 * The last net beneath every page.
 *
 * Without this, an unhandled render error drops the visitor onto Next's raw
 * error screen — which, for someone who has just spent ten minutes on a brief,
 * reads as "your work is gone". It usually isn't: drafts live in their own
 * browser and a generated brief is already saved, so the honest message is
 * "try again" rather than an apology for lost work.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-20 text-center sm:px-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        Something went wrong
      </div>
      <h1 className="mt-4 font-serif text-[clamp(26px,4vw,38px)] font-normal leading-[1.15] tracking-tight text-txt">
        That didn&apos;t load properly.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-txt-2">
        Your work is safe. Anything in progress is kept in this browser, and a
        finished brief is saved as soon as it is made.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="border border-acc bg-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-acc-h"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-bdr-2 px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc"
        >
          Home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-txt-3">
          Reference {error.digest}
        </p>
      )}
    </main>
  );
}
